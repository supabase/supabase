import { keyword, literal, safeSql, type SafeSqlFragment } from '@supabase/pg-meta/src/pg-format'
import { toString as CronToString } from 'cronstrue'
import { Column } from 'react-data-grid'
import { cn } from 'ui'

import { CronJobType } from './CreateCronJobSheet/CreateCronJobSheet.constants'
import { CRON_TABLE_COLUMNS, HTTPHeader, secondsPattern } from './CronJobs.constants'
import { CronJobTableCell } from './CronJobTableCell'
import { CronJob } from '@/data/database-cron-jobs/database-cron-jobs-infinite-query'
import { isEdgeFunctionUrl } from '@/lib/api/edgeFunctions'
import { IS_PLATFORM } from '@/lib/constants'

const unescapeSqlLiteral = (value = '', isEscapeString = false) => {
  const unescaped = value.replaceAll("''", "'")
  return isEscapeString ? unescaped.replaceAll('\\\\', '\\') : unescaped
}

/**
 * Strips the surrounding quotes from a single SQL string literal and unescapes its
 * contents, handling the optional `E''` escape-string prefix.
 */
const unwrapSqlLiteral = (token: string) => {
  const trimmed = token.trim()
  const isEscapeString = /^e'/i.test(trimmed)
  const withoutPrefix = isEscapeString ? trimmed.slice(1) : trimmed
  const withoutQuotes = withoutPrefix.replace(/^'|'$/g, '')
  return unescapeSqlLiteral(withoutQuotes, isEscapeString)
}

/**
 * Splits a SQL argument list starting after its `(`, respecting quotes and nested parentheses.
 * Returns the raw arguments and the index of the closing `)`, or undefined if unbalanced.
 */
const splitSqlArgs = (sql: string, start: number) => {
  const args: string[] = []
  let current = ''
  let depth = 1
  let inQuote = false
  let hasContent = false
  let i = start

  for (; i < sql.length; i++) {
    const char = sql[i]

    if (inQuote) {
      if (char === "'" && sql[i + 1] === "'") {
        current += "''"
        i++
        continue
      }
      if (char === "'") inQuote = false
      current += char
      continue
    }

    if (char === "'") {
      inQuote = true
      current += char
      hasContent = true
    } else if (char === '(') {
      depth++
      current += char
    } else if (char === ')') {
      depth--
      if (depth === 0) break
      current += char
    } else if (char === ',' && depth === 1) {
      args.push(current)
      current = ''
    } else {
      current += char
      if (char.trim().length > 0) hasContent = true
    }
  }

  if (depth !== 0) return undefined

  if (hasContent || args.length > 0) args.push(current)

  return { args, end: i }
}

const parseJsonBuildObjectArgs = (command: string) => {
  const match = command.match(/headers:=jsonb_build_object\s*\(/i)
  if (!match || match.index === undefined) return []

  const result = splitSqlArgs(command, match.index + match[0].length)
  return result ? result.args.map(unwrapSqlLiteral) : []
}

const SQL_STRING_LITERAL = /^e?'(?:''|[^'])*'$/i
const SQL_STRING_LITERAL_WITH_CAST = /^e?'(?:''|[^'])*'(?:\s*::\s*(?:jsonb|json|text))?$/i

const isJsonBuildObjectOfLiterals = (value: string) => {
  const match = value.match(/^jsonb_build_object\s*\(/i)
  if (!match) return false
  const result = splitSqlArgs(value, match[0].length)
  if (!result || value.slice(result.end + 1).trim().length > 0) return false
  return result.args.every((arg) => SQL_STRING_LITERAL.test(arg.trim()))
}

// The HTTP form rebuilds the command from its fields, so anything else is edited as a SQL snippet
const isFormRepresentableHttpCommand = (command: string) => {
  const match = command.match(/^select\s+net\.(http_get|http_post)\s*\(/i)
  if (!match) return false

  const result = splitSqlArgs(command, match[0].length)
  if (!result) return false
  if (!/^\s*;?\s*$/.test(command.slice(result.end + 1))) return false

  return result.args.every((arg) => {
    const namedArg = arg.trim().match(/^([a-z_]+)\s*:=\s*([\s\S]*)$/i)
    if (!namedArg) return false
    const name = namedArg[1].toLowerCase()
    const value = namedArg[2].trim()

    switch (name) {
      case 'url':
        return SQL_STRING_LITERAL.test(value)
      case 'body':
        return SQL_STRING_LITERAL_WITH_CAST.test(value)
      case 'headers':
        return SQL_STRING_LITERAL_WITH_CAST.test(value) || isJsonBuildObjectOfLiterals(value)
      case 'timeout_milliseconds':
        return /^\d+$/.test(value)
      default:
        return false
    }
  })
}

export function buildCronCreateQuery(
  name: string,
  schedule: string,
  command: string
): SafeSqlFragment {
  return safeSql`select cron.schedule(${literal(name)}, ${literal(schedule)}, ${literal(command)});`
}

export function buildCronUpdateQuery(
  jobId: number,
  schedule: string,
  command: string
): SafeSqlFragment {
  return safeSql`select cron.alter_job(job_id := ${literal(jobId)}, schedule := ${literal(schedule)}, command := ${literal(command)});`
}

export const buildHttpRequestCommand = (
  method: 'GET' | 'POST',
  url: string,
  headers: HTTPHeader[] = [],
  body: string | undefined,
  timeout: number
): SafeSqlFragment => {
  const funcName = keyword(method === 'GET' ? 'http_get' : 'http_post')
  const headersJson = JSON.stringify(
    Object.fromEntries(headers.filter((v) => v.name && v.value).map((v) => [v.name, v.value]))
  )
  const bodyPart = method === 'POST' && body ? safeSql`\n      body:=${literal(body)},` : safeSql``
  return safeSql`
select
  net.${funcName}(
      url:=${literal(url)},
      headers:=${literal(headersJson)}::jsonb, ${bodyPart}
      timeout_milliseconds:=${literal(timeout)}
  );`
}

// Default of pg_net's `timeout_milliseconds` argument, used when a command omits it
const PG_NET_DEFAULT_TIMEOUT_MS = 5000

const DEFAULT_CRONJOB_COMMAND = {
  type: 'sql_snippet',
  snippet: '',
  // add default values for the other command types. Even though they don't exist in sql_snippet, they'll still work as default values.
  method: 'POST',
  timeoutMs: 1000,
  httpBody: '',
} as const

export const parseCronJobCommand = (
  originalCommand: string,
  projectRef: string,
  restUrl?: string,
  isPlatform = IS_PLATFORM
): CronJobType => {
  const command = originalCommand.replaceAll('$$', ' ').replaceAll(/\n/g, ' ').trim()

  if (command.toLocaleLowerCase().match(/^select\s+net\./)) {
    if (!isFormRepresentableHttpCommand(command)) {
      return { type: 'sql_snippet', snippet: originalCommand }
    }

    const methodMatch = command.match(/select\s+net\.([^']+)\(\s*url:=/i)
    const method = methodMatch?.[1] || ''

    const urlMatch = command.match(/url:=(E)?'((?:''|[^'])*)'/i)
    const url = unescapeSqlLiteral(urlMatch?.[2], Boolean(urlMatch?.[1]))

    const bodyMatch = command.match(/body:=(E)?'((?:''|[^'])*)'/i)
    const body = unescapeSqlLiteral(bodyMatch?.[2], Boolean(bodyMatch?.[1]))

    const timeoutMatch = command.match(/timeout_milliseconds:=(\d+)/i)
    const timeoutMs = timeoutMatch ? Number(timeoutMatch[1]) : PG_NET_DEFAULT_TIMEOUT_MS

    let headersObjs: { name: string; value: string }[] = []
    if (/headers:=jsonb_build_object\s*\(/i.test(command)) {
      const args = parseJsonBuildObjectArgs(command)

      for (let i = 0; i < args.length; i += 2) {
        const name = args[i]
        if (name && name.length > 0) {
          headersObjs.push({ name, value: args[i + 1] ?? '' })
        }
      }
    } else {
      const headersStringMatch = command.match(/headers:=(E)?'((?:''|[^'])*)'/i)
      const headersString =
        unescapeSqlLiteral(headersStringMatch?.[2], Boolean(headersStringMatch?.[1])) || '{}'
      try {
        const parsedHeaders = JSON.parse(headersString)
        headersObjs = Object.entries(parsedHeaders).map(([name, value]) => ({
          name,
          value: value as string,
        }))
      } catch (error) {
        console.error('Error parsing headers:', error)
      }
    }

    // If there's a search param or hash in the edge function URL, let it be handled by the HTTP Request case.
    // Otherwise, the params/hash may be lost during editing of the cron job.
    let searchParams = ''
    let urlHash = ''
    try {
      const urlObject = new URL(url)
      searchParams = urlObject.search
      urlHash = urlObject.hash
    } catch {}

    if (
      isEdgeFunctionUrl(url, projectRef, restUrl, isPlatform) &&
      searchParams.length === 0 &&
      urlHash.length === 0
    ) {
      return {
        type: 'edge_function',
        method: method === 'http_get' ? 'GET' : 'POST',
        edgeFunctionName: url,
        httpHeaders: headersObjs,
        httpBody: body,
        timeoutMs,
        snippet: originalCommand,
      }
    }

    if (url !== '') {
      return {
        type: 'http_request',
        method: method === 'http_get' ? 'GET' : 'POST',
        endpoint: url,
        httpHeaders: headersObjs,
        httpBody: body,
        timeoutMs,
        snippet: originalCommand,
      }
    }
  }

  const regexDBFunction = /select\s+[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\s*\(\)/g
  if (command.toLocaleLowerCase().match(regexDBFunction)) {
    const [schemaName, functionName] = command
      .replace(/^select\s+/i, '')
      .replace(/\(.*\);*/, '')

      .trim()
      .split('.')

    return {
      type: 'sql_function',
      schema: schemaName,
      functionName: functionName,
      snippet: originalCommand,
    }
  }

  if (command.length > 0) {
    return {
      type: 'sql_snippet',
      snippet: originalCommand,
    }
  }

  return DEFAULT_CRONJOB_COMMAND
}

export function calculateDuration(start: string, end: string): string {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  const duration = endTime - startTime

  if (isNaN(duration)) return 'Invalid Date'

  if (duration < 1000) return `${duration}ms`
  if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
  return `${(duration / 60000).toFixed(1)}m`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short', // Use 'long' for full month name
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // Use 12-hour format if preferred
    timeZoneName: 'short', // Optional: to include timezone
  }
  return date.toLocaleString(undefined, options)
}

export function isSecondsFormat(schedule: string): boolean {
  return secondsPattern.test(schedule.trim().toLocaleLowerCase())
}

export function getScheduleMessage(scheduleString: string) {
  if (!scheduleString) {
    return 'Enter a valid cron expression above'
  }

  // if the schedule is in seconds format, scheduleString is same as the schedule
  if (secondsPattern.test(scheduleString)) {
    return `The cron will run every ${scheduleString}`
  }

  if (scheduleString.includes('Invalid cron expression')) {
    return scheduleString
  }

  const readableSchedule = scheduleString
    .split(' ')
    .map((s, i) => (i === 0 ? s.toLowerCase() : s))
    .join(' ')

  return `The cron will run ${readableSchedule}.`
}

export const formatScheduleString = (value: string) => {
  try {
    if (secondsPattern.test(value)) {
      return value
    } else {
      return CronToString(value)
    }
  } catch (error) {
    return ''
  }
}

export const formatCronJobColumns = ({
  onSelectEdit,
  onSelectDelete,
}: {
  onSelectEdit: (job: CronJob) => void
  onSelectDelete: (job: CronJob) => void
}): Array<Column<CronJob>> => {
  return CRON_TABLE_COLUMNS.map((col) => {
    const res: Column<CronJob> = {
      key: col.id,
      name: col.name,
      minWidth: col.minWidth ?? 100,
      maxWidth: col.maxWidth,
      width: col.width,
      resizable: col.resizable ?? false,
      sortable: false,
      draggable: false,
      headerCellClass: undefined,
      renderHeaderCell: () => {
        return (
          <div
            className={cn(
              'flex items-center justify-between font-normal text-xs w-full',
              col.id === 'jobname' && 'ml-8'
            )}
          >
            <p className="text-foreground!">{col.name}</p>
          </div>
        )
      },
      renderCell: ({ row }) => (
        <CronJobTableCell
          row={row}
          col={col}
          onSelectEdit={onSelectEdit}
          onSelectDelete={onSelectDelete}
        />
      ),
    }
    return res
  })
}

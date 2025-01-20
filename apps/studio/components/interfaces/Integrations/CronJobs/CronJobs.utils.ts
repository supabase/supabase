import parser from 'cron-parser'
import { toString as CronToString } from 'cronstrue'
import dayjs from 'dayjs'

import { CronJobType } from './CreateCronJobSheet'
import { HTTPHeader } from './CronJobs.constants'

export const buildCronQuery = (name: string, schedule: string, command: string) => {
  return `select cron.schedule('${name}','${schedule}',${command});`
}

export const buildHttpRequestCommand = (
  method: 'GET' | 'POST',
  url: string,
  headers: HTTPHeader[],
  body: string | undefined,
  timeout: number
) => {
  return `
select
  net.${method === 'GET' ? 'http_get' : 'http_post'}(
      url:='${url}',
      headers:=jsonb_build_object(${headers
        .filter((v) => v.name && v.value)
        .map((v) => `'${v.name}', '${v.value}'`)
        .join(', ')}), ${method === 'POST' && body ? `\n      body:='${body}',` : ''}
      timeout_milliseconds:=${timeout}
  );`
}

const DEFAULT_CRONJOB_COMMAND = {
  type: 'sql_snippet',
  snippet: '',
  // add default values for the other command types. Even though they don't exist in sql_snippet, they'll still work as default values.
  method: 'POST',
  timeoutMs: 1000,
  httpBody: '',
} as const

export const parseCronJobCommand = (originalCommand: string, projectRef: string): CronJobType => {
  const command = originalCommand
    .replaceAll('$$', ' ')
    .replaceAll(/\n/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()

  if (command.toLocaleLowerCase().startsWith('select net.')) {
    const methodMatch = command.match(/select net\.([^']+)\(\s*url:=/i)
    const method = methodMatch?.[1] || ''

    const urlMatch = command.match(/url:='([^']+)'/i)
    const url = urlMatch?.[1] || ''

    const bodyMatch = command.match(/body:='(.*)'/i)
    const body = bodyMatch?.[1] || ''

    const timeoutMatch = command.match(/timeout_milliseconds:=(\d+)/i)
    const timeout = timeoutMatch?.[1] || ''

    const headersJsonBuildObjectMatch = command.match(/headers:=jsonb_build_object\(([^)]*)/i)
    const headersJsonBuildObject = headersJsonBuildObjectMatch?.[1] || ''

    let headersObjs: { name: string; value: string }[] = []
    if (headersJsonBuildObject) {
      // convert the header string to array of objects, clean up the values, trim them of spaces and remove the quotation marks at start and end
      const headers = headersJsonBuildObject.split(',').map((s) => s.trim().replace(/^'|'$/g, ''))

      for (let i = 0; i < headers.length; i += 2) {
        if (headers[i] && headers[i].length > 0) {
          headersObjs.push({ name: headers[i], value: headers[i + 1] })
        }
      }
    } else {
      const headersStringMatch = command.match(/headers:='([^']*)'/i)
      const headersString = headersStringMatch?.[1] || ''
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

    if (url.includes(`${projectRef}.supabase.`) && url.includes('/functions/v1/')) {
      return {
        type: 'edge_function',
        method: method === 'http_get' ? 'GET' : 'POST',
        edgeFunctionName: url,
        httpHeaders: headersObjs,
        httpBody: body,
        timeoutMs: Number(timeout ?? 1000),
        snippet: originalCommand,
      }
    }

    return {
      type: 'http_request',
      method: method === 'http_get' ? 'GET' : 'POST',
      endpoint: url,
      httpHeaders: headersObjs,
      httpBody: body,
      timeoutMs: Number(timeout ?? 1000),
      snippet: originalCommand,
    }
  }

  const regexDBFunction = /select\s+[a-zA-Z-_]*\.?[a-zA-Z-_]*\s*\(.+/g
  if (command.toLocaleLowerCase().match(regexDBFunction)) {
    const [schemaName, functionName] = command
      .replace('SELECT ', '')
      .replace(/\(.*\)/, '')
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

export const cronPattern =
  /^(\*|(\d+|\*\/\d+)|\d+\/\d+|\d+-\d+|\d+(,\d+)*)(\s+(\*|(\d+|\*\/\d+)|\d+\/\d+|\d+-\d+|\d+(,\d+)*)){4}$/

// detect seconds like "10 seconds" or normal cron syntax like "*/5 * * * *"
export const secondsPattern = /^\d+\s+seconds$/

export function isSecondsFormat(schedule: string): boolean {
  return secondsPattern.test(schedule.trim())
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

export const convertCronToString = (schedule: string) => {
  // pg_cron can also use "30 seconds" format for schedule. Cronstrue doesn't understand that format so just use the
  // original schedule when cronstrue throws
  try {
    return CronToString(schedule)
  } catch (error) {
    return schedule
  }
}

export const getNextRun = (schedule: string, lastRun?: string) => {
  // cron-parser can only deal with the traditional cron syntax but technically users can also
  // use strings like "30 seconds" now, For the latter case, we try our best to parse the next run
  // (can't guarantee as scope is quite big)
  if (schedule.includes('*')) {
    try {
      const interval = parser.parseExpression(schedule, { tz: 'UTC' })
      return interval.next().getTime()
    } catch (error) {
      return undefined
    }
  } else {
    // [Joshen] Only going to attempt to parse if the schedule is as simple as "n seconds", "n minutes", or "n days"
    // Returned undefined otherwise - we can revisit this perhaps if we get feedback about this
    const [value, unit] = schedule.split(' ')
    if (
      ['seconds', 'minutes', 'days'].includes(unit) &&
      !Number.isNaN(Number(value)) &&
      lastRun !== undefined
    ) {
      const parsedLastRun = dayjs(lastRun).add(Number(value), unit as dayjs.ManipulateType)
      return parsedLastRun.valueOf()
    } else {
      return undefined
    }
  }
}

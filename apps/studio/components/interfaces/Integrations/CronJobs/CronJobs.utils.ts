import { CronJobType } from './CreateCronJobSheet'
import { HTTPHeader } from './CronJobs.constants'

export const buildCronQuery = (name: string, schedule: string, command: string) => {
  return `select cron.schedule('${name}','${schedule}',${command});`
}

export const buildHttpRequestCommand = (
  method: 'GET' | 'POST',
  url: string,
  headers: HTTPHeader[],
  body: string,
  timeout: number
) => {
  return `$$
    select
      net.${method === 'GET' ? 'http_get' : 'http_post'}(
          url:='${url}',
          headers:=jsonb_build_object(${headers
            .filter((v) => v.name && v.value)
            .map((v) => `'${v.name}', '${v.value}'`)
            .join(', ')}),
          ${method === 'POST' ? `body:='${body}',` : ''}
          timeout_milliseconds:=${timeout}
      );
    $$`
}

const DEFAULT_CRONJOB_COMMAND = {
  type: 'sql_snippet',
  snippet: '',
  // add default values for the other command types. Even though they don't exist in sql_snippet, they'll still work as default values.
  method: 'POST',
  timeoutMs: 1000,
  httpBody: '',
} as const

export const parseCronJobCommand = (originalCommand: string): CronJobType => {
  const command = originalCommand
    .replaceAll('$$', ' ')
    .replaceAll(/\n/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()

  if (command.toLocaleLowerCase().startsWith('select net.')) {
    let matches =
      command.match(
        /select net\.([^']+)\(\s*url:='([^']+)',\s*headers:=jsonb_build_object\(([^)]*)\),(?:\s*body:='(.*)',)?\s*timeout_milliseconds:=(\d+) \)/i
      ) || []

    // if the match has been unsuccesful, the cron may be created with the previous encoding/parsing.
    if (matches.length === 0) {
      matches =
        command.match(
          /select net\.([^']+)\(\s*url:='([^']+)',\s*headers:=jsonb_build_object\(([^)]*)\),\s*body:=jsonb_build_object\(([^]*)\s*\),\s*timeout_milliseconds:=(\d+) \)/i
        ) || []
    }

    // convert the header string to array of objects, clean up the values, trim them of spaces and remove the quotation marks at start and end
    const headers = (matches[3] || '').split(',').map((s) => s.trim().replace(/^'|'$/g, ''))
    const headersObjs: { name: string; value: string }[] = []
    for (let i = 0; i < headers.length; i += 2) {
      if (headers[i] && headers[i].length > 0) {
        headersObjs.push({ name: headers[i], value: headers[i + 1] })
      }
    }

    const url = matches[2] || ''
    const body = matches[4] || ''

    if (url.includes('.supabase.') && url.includes('/functions/v1/')) {
      return {
        type: 'edge_function',
        method: matches[1] === 'http_get' ? 'GET' : 'POST',
        edgeFunctionName: url,
        httpHeaders: headersObjs,
        httpBody: body,
        timeoutMs: +matches[5] ?? 1000,
      }
    }

    return {
      type: 'http_request',
      method: matches[1] === 'http_get' ? 'GET' : 'POST',
      endpoint: url,
      httpHeaders: headersObjs,
      httpBody: body,
      timeoutMs: +matches[5] ?? 1000,
    }
  }

  if (command.toLocaleLowerCase().startsWith('call ')) {
    const [schemaName, functionName] = command
      .replace('CALL ', '')
      .replace('()', '')
      .trim()
      .split('.')

    return {
      type: 'sql_function',
      schema: schemaName,
      functionName: functionName,
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
  return isNaN(duration) ? 'Invalid Date' : `${duration} ms`
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

export function getScheduleMessage(scheduleString: string, schedule: string) {
  if (!scheduleString) {
    return 'Enter a valid cron expression above'
  }

  if (secondsPattern.test(schedule)) {
    return `The cron will be run every ${schedule}`
  }

  if (scheduleString.includes('Invalid cron expression')) {
    return scheduleString
  }

  const readableSchedule = scheduleString
    .split(' ')
    .map((s, i) => (i === 0 ? s.toLowerCase() : s))
    .join(' ')

  return `The cron will be run ${readableSchedule}.`
}

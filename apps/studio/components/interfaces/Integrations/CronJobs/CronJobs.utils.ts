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
          ${method === 'POST' ? `body:='${body}'` : ''},
          timeout_milliseconds:=${timeout}
      );
    $$`
}

const DEFAULT_CRONJOB_COMMAND = {
  type: 'sql_snippet',
  snippet: '',
} as const

export const parseCronJobCommand = (originalCommand: string): CronJobType => {
  const command = originalCommand
    .replaceAll('$$', ' ')
    .replaceAll(/\n/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()

  if (command.toLocaleLowerCase().startsWith('select net.')) {
    const methodMatch = command.match(/net\.(http_[^(]+)/i)?.[1] || ''
    const urlMatch = command.match(/url:='([^']+)'/)?.[1] || ''
    const bodyMatch = command.match(/body:='(.*?)(?=',\s*timeout_milliseconds)/s)?.[1] || ''
    const timeoutMatch = command.match(/timeout_milliseconds:=(\d+)/)?.[1] || '1000'
    const headersMatch = command.match(/headers:=jsonb_build_object\(([^)]*)\)/)?.[1] || ''

    const method = methodMatch === 'http_get' ? 'GET' : 'POST'
    const url = urlMatch
    const headers = (headersMatch || '').split(',').map((s) => s.trim().replace(/^'|'$/g, ''))
    const body = bodyMatch
    const timeout = parseInt(timeoutMatch)

    if (url.includes('.supabase.') && url.includes('/functions/v1/')) {
      return {
        type: 'edge_function',
        method: method,
        edgeFunctionName: url,
        httpHeaders: headers.map((h) => ({ name: h, value: '' })),
        httpBody: body,
        timeoutMs: timeout,
      }
    }

    return {
      type: 'http_request',
      method: method,
      endpoint: url,
      httpHeaders: headers.map((h) => ({ name: h, value: '' })),
      httpBody: body,
      timeoutMs: timeout,
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

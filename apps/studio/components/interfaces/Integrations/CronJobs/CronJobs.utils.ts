import { CronJobType } from './CreateCronJobSheet'
import { HTTPHeader, HTTPParameter } from './CronJobs.constants'

export const buildCronQuery = (name: string, schedule: string, command: string) => {
  return `select cron.schedule('${name}','${schedule}',${command});`
}

export const buildHttpRequestCommand = (
  method: 'GET' | 'POST',
  url: string,
  headers: HTTPHeader[],
  body: HTTPParameter[],
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
          body:=jsonb_build_object(${body
            .filter((v) => v.name && v.value)
            .map((v) => `'${v.name}', '${v.value}'`)
            .join(', ')}),
          timeout_milliseconds:=${timeout}
      );
    $$`
}

export const DEFAULT_CRONJOB_COMMAND = {
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
    const matches =
      command.match(
        /select net\.([^']+)\(\s*url:='([^']+)',\s*headers:=jsonb_build_object\(([^)]*)\),\s*body:=jsonb_build_object\(([^]*)\s*\),\s*timeout_milliseconds:=(\d+) \)/i
      ) || []

    // convert the header string to array of objects, clean up the values, trim them of spaces and remove the quotation marks at start and end
    const headers = (matches[3] || '').split(',').map((s) => s.trim().replace(/^'|'$/g, ''))
    const headersObjs: { name: string; value: string }[] = []
    for (let i = 0; i < headers.length; i += 2) {
      if (headers[i] && headers[i].length > 0) {
        headersObjs.push({ name: headers[i], value: headers[i + 1] })
      }
    }

    // convert the parameter string to array of objects, clean up the values, trim them of spaces and remove the quotation marks at start and end
    const parameters = (matches[4] || '').split(',').map((s) => s.trim().replace(/^'|'$/g, ''))
    const parametersObjs: { name: string; value: string }[] = []
    for (let i = 0; i < parameters.length; i += 2) {
      if (parameters[i] && parameters[i].length > 0) {
        parametersObjs.push({ name: parameters[i], value: parameters[i + 1] })
      }
    }

    const url = matches[2] || ''

    if (url.includes('.supabase.') && url.includes('/functions/v1/')) {
      return {
        type: 'edge_function',
        method: matches[1] === 'http_get' ? 'GET' : 'POST',
        edgeFunctionName: url,
        httpHeaders: headersObjs,
        httpParameters: parametersObjs,
        timeoutMs: +matches[5] ?? 1000,
      }
    }

    return {
      type: 'http_request',
      method: matches[1] === 'http_get' ? 'GET' : 'POST',
      endpoint: url,
      httpHeaders: headersObjs,
      httpParameters: parametersObjs,
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

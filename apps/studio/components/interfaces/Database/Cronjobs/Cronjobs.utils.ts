import { HTTPHeader, HTTPParameter } from './Cronjobs.constants'

export const buildCronQuery = (name: string, schedule: string, command: string) => {
  return `select
  cron.schedule(
    '${name}',
    '${schedule}',
    ${command}
  );`
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
          headers:=jsonb_build_object(${headers.map((v) => `'${v.name}, ${v.value}'`).join(', ')}),
          body:=jsonb_build_object(${body.map((v) => `'${v.name}, ${v.value}'`).join(', ')}),
          timeout_milliseconds:=${timeout}
      ) as request_id;
    $$`
}

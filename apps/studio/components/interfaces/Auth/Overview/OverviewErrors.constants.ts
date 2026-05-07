import dayjs from 'dayjs'
import { fetchLogs } from 'data/reports/report.utils'

export type ResponseErrorRow = {
  method: string
  path: string
  status_code: number
  count: number
}

export type AuthErrorCodeRow = {
  error_code: string
  count: number
}

export const getDateRange = () => {
  return {
    start: dayjs().subtract(24, 'hour').toISOString(),
    end: dayjs().toISOString(),
  }
}

// Top API response errors for /auth/v1 endpoints (path/method/status)
export const AUTH_TOP_RESPONSE_ERRORS_SQL = `
  select
    request.method as method,
    request.path as path,
    response.status_code as status_code,
    count(*) as count
  from edge_logs
    cross join unnest(metadata) as m
    cross join unnest(m.request) as request
    cross join unnest(m.response) as response
  where path like '%auth/v1%'
    and response.status_code between 400 and 599
  group by method, path, status_code
  order by count desc
  limit 10
`

// Top Auth service error codes from x_sb_error_code header for /auth/v1 endpoints
export const AUTH_TOP_ERROR_CODES_SQL = `
  select
    h.x_sb_error_code as error_code,
    count(*) as count
  from edge_logs
    cross join unnest(metadata) as m
    cross join unnest(m.request) as request
    cross join unnest(m.response) as response
    cross join unnest(response.headers) as h
  where path like '%auth/v1%'
    and response.status_code between 400 and 599
    and h.x_sb_error_code is not null
  group by error_code
  order by count desc
  limit 10
`

export const fetchTopResponseErrors = async (projectRef: string) => {
  const { start, end } = getDateRange()
  return await fetchLogs(projectRef, AUTH_TOP_RESPONSE_ERRORS_SQL, start, end)
}

export const fetchTopAuthErrorCodes = async (projectRef: string) => {
  const { start, end } = getDateRange()
  return await fetchLogs(projectRef, AUTH_TOP_ERROR_CODES_SQL, start, end)
}

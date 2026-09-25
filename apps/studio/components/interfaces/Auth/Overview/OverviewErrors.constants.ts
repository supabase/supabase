import dayjs from 'dayjs'
import { z } from 'zod'

import { pickLogsQueryBuilder } from '@/data/logs/logs-endpoint'
import { safeSql } from '@/data/logs/safe-analytics-sql'
import { fetchLogs } from '@/data/reports/report.utils'

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
export const AUTH_TOP_RESPONSE_ERRORS_SQL = safeSql`
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
export const AUTH_TOP_ERROR_CODES_SQL = safeSql`
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

export const AUTH_TOP_RESPONSE_ERRORS_SQL_OTEL = safeSql`
  select
    log_attributes['request.method'] as method,
    log_attributes['request.path'] as path,
    toInt32OrZero(log_attributes['response.status_code']) as status_code,
    count() as count
  from logs
  where source = 'edge_logs'
    and path like '%auth/v1%'
    and status_code between 400 and 599
  group by method, path, status_code
  order by count desc
  limit 10
`

export const AUTH_TOP_ERROR_CODES_SQL_OTEL = safeSql`
  select
    log_attributes['response.headers.x_sb_error_code'] as error_code,
    count() as count
  from logs
  where source = 'edge_logs'
    and log_attributes['request.path'] like '%auth/v1%'
    and toInt32OrZero(log_attributes['response.status_code']) between 400 and 599
    and error_code != ''
  group by error_code
  order by count desc
  limit 10
`

const countSchema = z.union([z.number(), z.string().min(1)]).pipe(z.coerce.number().finite())
const responseErrorSchema = z.object({
  method: z.string(),
  path: z.string(),
  status_code: countSchema,
  count: countSchema,
})
const authErrorCodeSchema = z.object({ error_code: z.string(), count: countSchema })

export const parseResponseErrors = (rows: unknown[]): ResponseErrorRow[] =>
  rows.flatMap((row) => {
    const result = responseErrorSchema.safeParse(row)
    return result.success ? [result.data] : []
  })

export const parseAuthErrorCodes = (rows: unknown[]): AuthErrorCodeRow[] =>
  rows.flatMap((row) => {
    const result = authErrorCodeSchema.safeParse(row)
    return result.success ? [result.data] : []
  })

export const fetchTopResponseErrors = async (projectRef: string, useOtel = false) => {
  const { start, end } = getDateRange()
  const sql = pickLogsQueryBuilder(
    useOtel,
    AUTH_TOP_RESPONSE_ERRORS_SQL_OTEL,
    AUTH_TOP_RESPONSE_ERRORS_SQL
  )
  const data = await fetchLogs(projectRef, sql, start, end, useOtel)
  if (data?.error) {
    throw new Error(typeof data.error === 'string' ? data.error : data.error.message)
  }
  return data
}

export const fetchTopAuthErrorCodes = async (projectRef: string, useOtel = false) => {
  const { start, end } = getDateRange()
  const sql = pickLogsQueryBuilder(useOtel, AUTH_TOP_ERROR_CODES_SQL_OTEL, AUTH_TOP_ERROR_CODES_SQL)
  const data = await fetchLogs(projectRef, sql, start, end, useOtel)
  if (data?.error) {
    throw new Error(typeof data.error === 'string' ? data.error : data.error.message)
  }
  return data
}

import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { queryInsightsKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { safeSql, type SafeLogSqlFragment } from '@/data/logs/safe-analytics-sql'
import type { ResponseError } from '@/types'

export type QueryInsightsVariables = {
  projectRef?: string
  isoTimestampStart: string
  isoTimestampEnd: string
  useOtel: boolean
}

const numericMetricSchema = z.union([z.number(), z.string(), z.null()])

const queryInsightsRowsSchema = z.array(
  z.object({
    timestamp: z.union([z.string(), z.number(), z.null()]),
    application_name: z.string().nullable(),
    calls: numericMetricSchema,
    database_name: z.string().nullable(),
    query: z.string().nullable(),
    query_id: numericMetricSchema,
    total_exec_time: numericMetricSchema,
    total_plan_time: numericMetricSchema,
    user_name: z.string().nullable(),
    mean_exec_time: numericMetricSchema,
    min_exec_time: numericMetricSchema,
    max_exec_time: numericMetricSchema,
    mean_plan_time: numericMetricSchema,
    min_plan_time: numericMetricSchema,
    max_plan_time: numericMetricSchema,
    p50_exec_time: numericMetricSchema,
    p95_exec_time: numericMetricSchema,
    p50_plan_time: numericMetricSchema,
    p95_plan_time: numericMetricSchema,
  })
)

const getQueryInsightsSqlLegacy = (): SafeLogSqlFragment =>
  safeSql`
select
  TIMESTAMP_TRUNC(sml.timestamp, MINUTE) as timestamp,
  CAST(sml_parsed.application_name AS STRING) as application_name,
  SUM(sml_parsed.calls) as calls,
  CAST(sml_parsed.database_name AS STRING) as database_name,
  CAST(sml_parsed.query AS STRING) as query,
  sml_parsed.query_id as query_id,
  SUM(sml_parsed.total_exec_time) as total_exec_time,
  SUM(sml_parsed.total_plan_time) as total_plan_time,
  CAST(sml_parsed.user_name AS STRING) as user_name,
  CASE WHEN SUM(sml_parsed.calls) > 0
    THEN SUM(sml_parsed.total_exec_time) / SUM(sml_parsed.calls)
    ELSE 0
  END as mean_exec_time,
  MIN(NULLIF(sml_parsed.total_exec_time, 0)) as min_exec_time,
  MAX(sml_parsed.total_exec_time) as max_exec_time,
  CASE WHEN SUM(sml_parsed.calls) > 0
    THEN SUM(sml_parsed.total_plan_time) / SUM(sml_parsed.calls)
    ELSE 0
  END as mean_plan_time,
  MIN(NULLIF(sml_parsed.total_plan_time, 0)) as min_plan_time,
  MAX(sml_parsed.total_plan_time) as max_plan_time,
  APPROX_QUANTILES(sml_parsed.total_exec_time, 100)[OFFSET(50)] as p50_exec_time,
  APPROX_QUANTILES(sml_parsed.total_exec_time, 100)[OFFSET(95)] as p95_exec_time,
  APPROX_QUANTILES(sml_parsed.total_plan_time, 100)[OFFSET(50)] as p50_plan_time,
  APPROX_QUANTILES(sml_parsed.total_plan_time, 100)[OFFSET(95)] as p95_plan_time
from supamonitor_logs as sml
cross join unnest(sml.metadata) as sml_metadata
cross join unnest(sml_metadata.supamonitor) as sml_parsed
where sml.event_message = 'log'
group by timestamp, user_name, database_name, application_name, query_id, query
order by timestamp desc
`

export const getQueryInsightsSqlOtel = (): SafeLogSqlFragment =>
  safeSql`
select
  toStartOfMinute(timestamp) as timestamp,
  log_attributes['supamonitor.application_name'] as application_name,
  sum(toUInt64OrZero(log_attributes['supamonitor.calls'])) as calls,
  log_attributes['supamonitor.database_name'] as database_name,
  log_attributes['supamonitor.query'] as query,
  toInt64OrZero(log_attributes['supamonitor.query_id']) as query_id,
  sum(toFloat64OrZero(log_attributes['supamonitor.total_exec_time'])) as total_exec_time,
  sum(toFloat64OrZero(log_attributes['supamonitor.total_plan_time'])) as total_plan_time,
  log_attributes['supamonitor.user_name'] as user_name,
  if(
    sum(toUInt64OrZero(log_attributes['supamonitor.calls'])) > 0,
    sum(toFloat64OrZero(log_attributes['supamonitor.total_exec_time'])) /
      sum(toUInt64OrZero(log_attributes['supamonitor.calls'])),
    0
  ) as mean_exec_time,
  min(nullIf(toFloat64OrZero(log_attributes['supamonitor.total_exec_time']), 0)) as min_exec_time,
  max(toFloat64OrZero(log_attributes['supamonitor.total_exec_time'])) as max_exec_time,
  if(
    sum(toUInt64OrZero(log_attributes['supamonitor.calls'])) > 0,
    sum(toFloat64OrZero(log_attributes['supamonitor.total_plan_time'])) /
      sum(toUInt64OrZero(log_attributes['supamonitor.calls'])),
    0
  ) as mean_plan_time,
  min(nullIf(toFloat64OrZero(log_attributes['supamonitor.total_plan_time']), 0)) as min_plan_time,
  max(toFloat64OrZero(log_attributes['supamonitor.total_plan_time'])) as max_plan_time,
  quantileTDigest(0.5)(toFloat64OrZero(log_attributes['supamonitor.total_exec_time'])) as p50_exec_time,
  quantileTDigest(0.95)(toFloat64OrZero(log_attributes['supamonitor.total_exec_time'])) as p95_exec_time,
  quantileTDigest(0.5)(toFloat64OrZero(log_attributes['supamonitor.total_plan_time'])) as p50_plan_time,
  quantileTDigest(0.95)(toFloat64OrZero(log_attributes['supamonitor.total_plan_time'])) as p95_plan_time
from logs
where source = 'supamonitor_logs'
  and event_message = 'log'
group by timestamp, user_name, database_name, application_name, query_id, query
order by timestamp desc
limit 10000
`

export const getQueryInsightsSql = (useOtel: boolean): SafeLogSqlFragment =>
  useOtel ? getQueryInsightsSqlOtel() : getQueryInsightsSqlLegacy()

async function getQueryInsights(
  { projectRef, isoTimestampStart, isoTimestampEnd, useOtel }: QueryInsightsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!isoTimestampStart) throw new Error('isoTimestampStart is required')
  if (!isoTimestampEnd) throw new Error('isoTimestampEnd is required')

  const data = await executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(useOtel),
    sql: getQueryInsightsSql(useOtel),
    iso_timestamp_start: isoTimestampStart,
    iso_timestamp_end: isoTimestampEnd,
    method: 'get',
    signal,
  })

  if (data?.error) handleError(data.error)

  return queryInsightsRowsSchema.parse(data?.result ?? [])
}

export type QueryInsightsData = Awaited<ReturnType<typeof getQueryInsights>>
export type QueryInsightsError = ResponseError

export const queryInsightsQueryOptions = ({
  projectRef,
  isoTimestampStart,
  isoTimestampEnd,
  useOtel,
}: QueryInsightsVariables) =>
  queryOptions({
    queryKey: queryInsightsKeys.data(projectRef, isoTimestampStart, isoTimestampEnd, useOtel),
    queryFn: ({ signal }) =>
      getQueryInsights({ projectRef, isoTimestampStart, isoTimestampEnd, useOtel }, signal),
    enabled: Boolean(projectRef && isoTimestampStart && isoTimestampEnd),
    refetchOnWindowFocus: false,
  })

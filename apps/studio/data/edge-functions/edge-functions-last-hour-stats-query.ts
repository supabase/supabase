import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'
import dayjs from 'dayjs'

import { edgeFunctionsKeys } from './keys'
import { handleError } from '@/data/fetchers'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import {
  analyticsLiteral,
  joinSqlFragments,
  safeSql,
  type SafeLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type EdgeFunctionsLastHourStatsVariables = {
  projectRef?: string
  functionIds?: string[]
  useOtel?: boolean
}

export type EdgeFunctionLastHourStats = {
  functionId: string
  requestsCount: number
  serverErrorCount: number
  errorRate: number
}

export type EdgeFunctionsLastHourStatsResponse = Record<string, EdgeFunctionLastHourStats>

function getEdgeFunctionsLastHourStatsSqlBq(functionIds: string[]): SafeLogSqlFragment {
  const functionIdFilter: SafeLogSqlFragment =
    functionIds.length > 0
      ? safeSql`  and function_id in (${joinSqlFragments(functionIds.map(analyticsLiteral), ', ')})\n`
      : safeSql``

  return safeSql`
-- edge-functions-last-hour-stats
select
  function_id,
  count(distinct id) as requests_count,
  count(distinct case when response.status_code >= 500 then id end) as server_err_count
from
  function_edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.response) as response
where
  function_id is not null
${functionIdFilter}group by
  function_id
`
}

function getEdgeFunctionsLastHourStatsSqlOtel(functionIds: string[]): SafeLogSqlFragment {
  const functionIdFilter: SafeLogSqlFragment =
    functionIds.length > 0
      ? safeSql`  and log_attributes['function_id'] in (${joinSqlFragments(functionIds.map(analyticsLiteral), ', ')})\n`
      : safeSql``

  return safeSql`
-- edge-functions-last-hour-stats
select
  log_attributes['function_id'] as function_id,
  count(distinct id) as requests_count,
  count(distinct case when toInt32OrZero(log_attributes['response.status_code']) >= 500 then id end) as server_err_count
from logs
where
  source = 'function_edge_logs'
  and log_attributes['function_id'] != ''
${functionIdFilter}group by
  function_id
`
}

function getEdgeFunctionsLastHourStatsSql(
  functionIds: string[],
  useOtel: boolean
): SafeLogSqlFragment {
  return useOtel
    ? getEdgeFunctionsLastHourStatsSqlOtel(functionIds)
    : getEdgeFunctionsLastHourStatsSqlBq(functionIds)
}

export async function getEdgeFunctionsLastHourStats(
  { projectRef, functionIds = [], useOtel = false }: EdgeFunctionsLastHourStatsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (functionIds.length === 0) return {}

  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(1, 'hour').toISOString()

  const data = await executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(useOtel),
    sql: getEdgeFunctionsLastHourStatsSql(functionIds, useOtel),
    iso_timestamp_start: startDate,
    iso_timestamp_end: endDate,
    key: 'last-hour-stats',
    signal,
  })

  if (data?.error) handleError(data.error)

  const result = (data?.result ?? []) as {
    function_id: string
    requests_count: number | string
    server_err_count: number | string
  }[]

  return result.reduce<EdgeFunctionsLastHourStatsResponse>((acc, row) => {
    const toSafeNumber = (v: number | string | undefined) => {
      const n = Number(v ?? 0)
      return Number.isFinite(n) ? n : 0
    }
    const safeRequestsCount = toSafeNumber(row.requests_count)
    const safeServerErrorCount = toSafeNumber(row.server_err_count)

    acc[row.function_id] = {
      functionId: row.function_id,
      requestsCount: safeRequestsCount,
      serverErrorCount: safeServerErrorCount,
      errorRate: safeRequestsCount > 0 ? (safeServerErrorCount / safeRequestsCount) * 100 : 0,
    }

    return acc
  }, {})
}

export type EdgeFunctionsLastHourStatsData = Awaited<
  ReturnType<typeof getEdgeFunctionsLastHourStats>
>
export type EdgeFunctionsLastHourStatsError = ResponseError

export const useEdgeFunctionsLastHourStatsQuery = <TData = EdgeFunctionsLastHourStatsData>(
  { projectRef, functionIds = [] }: EdgeFunctionsLastHourStatsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<
    EdgeFunctionsLastHourStatsData,
    EdgeFunctionsLastHourStatsError,
    TData
  > = {}
) => {
  const useOtel = useFlag('otelLegacyLogs')

  return useQuery<EdgeFunctionsLastHourStatsData, EdgeFunctionsLastHourStatsError, TData>({
    queryKey: edgeFunctionsKeys.lastHourStats(projectRef, functionIds, useOtel),
    queryFn: ({ signal }) =>
      getEdgeFunctionsLastHourStats({ projectRef, functionIds, useOtel }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && functionIds.length > 0,
    staleTime: 60 * 1000,
    retry: false,
    ...options,
  })
}

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { edgeFunctionsKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import { quoteLiteral } from '@/lib/pg-format'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type EdgeFunctionsLastHourStatsVariables = { projectRef?: string; functionIds?: string[] }

export type EdgeFunctionLastHourStats = {
  functionId: string
  requestsCount: number
  serverErrorCount: number
  errorRate: number
}

export type EdgeFunctionsLastHourStatsResponse = Record<string, EdgeFunctionLastHourStats>

function getEdgeFunctionsLastHourStatsSql(functionIds: string[]) {
  const functionIdFilter =
    functionIds.length > 0
      ? `  and function_id in (${functionIds.map(quoteLiteral).join(', ')})\n`
      : ''

  return `
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

export async function getEdgeFunctionsLastHourStats(
  { projectRef, functionIds = [] }: EdgeFunctionsLastHourStatsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (functionIds.length === 0) return {}

  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(1, 'hour').toISOString()

  const { data, error } = await post(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: {
      path: { ref: projectRef },
      // @ts-ignore [Joshen] Just to easily identify this request in the network tools
      query: { key: 'last-hour-stats' },
    },
    body: {
      sql: getEdgeFunctionsLastHourStatsSql(functionIds),
      iso_timestamp_start: startDate,
      iso_timestamp_end: endDate,
    },
    signal,
  })

  if (error || data?.error) {
    handleError(error ?? data?.error)
  }

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
) =>
  useQuery<EdgeFunctionsLastHourStatsData, EdgeFunctionsLastHourStatsError, TData>({
    queryKey: edgeFunctionsKeys.lastHourStats(projectRef, functionIds),
    queryFn: ({ signal }) => getEdgeFunctionsLastHourStats({ projectRef, functionIds }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && functionIds.length > 0,
    staleTime: 60 * 1000,
    retry: false,
    ...options,
  })

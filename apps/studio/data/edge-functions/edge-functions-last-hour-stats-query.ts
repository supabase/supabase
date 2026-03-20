import { useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import dayjs from 'dayjs'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionsLastHourStatsVariables = { projectRef?: string }

export type EdgeFunctionLastHourStats = {
  functionId: string
  requestsCount: number
  serverErrorCount: number
  errorRate: number
}

export type EdgeFunctionsLastHourStatsResponse = Record<string, EdgeFunctionLastHourStats>

const EDGE_FUNCTIONS_LAST_HOUR_STATS_SQL = `
select
  function_id,
  count(*) as requests_count,
  count(case when response.status_code >= 500 then 1 end) as server_err_count
from
  function_edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.response) as response
where
  function_id is not null
group by
  function_id
`

export async function getEdgeFunctionsLastHourStats(
  { projectRef }: EdgeFunctionsLastHourStatsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(1, 'hour').toISOString()

  const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: {
      path: { ref: projectRef },
      query: {
        sql: EDGE_FUNCTIONS_LAST_HOUR_STATS_SQL,
        iso_timestamp_start: startDate,
        iso_timestamp_end: endDate,
      },
    },
    signal,
  })

  if (error) handleError(error)

  const result = (data?.result ?? []) as {
    function_id: string
    requests_count: number | string
    server_err_count: number | string
  }[]

  return result.reduce<EdgeFunctionsLastHourStatsResponse>((acc, row) => {
    const requestsCount = Number(row.requests_count ?? 0)
    const serverErrorCount = Number(row.server_err_count ?? 0)

    acc[row.function_id] = {
      functionId: row.function_id,
      requestsCount,
      serverErrorCount,
      errorRate: requestsCount > 0 ? (serverErrorCount / requestsCount) * 100 : 0,
    }

    return acc
  }, {})
}

export type EdgeFunctionsLastHourStatsData = Awaited<
  ReturnType<typeof getEdgeFunctionsLastHourStats>
>
export type EdgeFunctionsLastHourStatsError = ResponseError

export const useEdgeFunctionsLastHourStatsQuery = <TData = EdgeFunctionsLastHourStatsData>(
  { projectRef }: EdgeFunctionsLastHourStatsVariables,
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
    queryKey: edgeFunctionsKeys.lastHourStats(projectRef),
    queryFn: ({ signal }) => getEdgeFunctionsLastHourStats({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    staleTime: 60 * 1000,
    ...options,
  })

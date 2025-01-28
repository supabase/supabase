import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type FunctionsReqStatsVariables = {
  projectRef?: string
  functionId?: string
  interval?: string
}

export type FunctionsReqStatsResponse = any

export async function getFunctionsReqStats(
  { projectRef, functionId, interval }: FunctionsReqStatsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!functionId) {
    throw new Error('functionId is required')
  }
  if (!interval) {
    throw new Error('interval is required')
  }

  const response = await get<FunctionsReqStatsResponse>(
    `${API_URL}/projects/${projectRef}/analytics/endpoints/functions.req-stats?interval=${interval}&function_id=${functionId}`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

export type FunctionsReqStatsData = Awaited<ReturnType<typeof getFunctionsReqStats>>
export type FunctionsReqStatsError = unknown

export const useFunctionsReqStatsQuery = <TData = FunctionsReqStatsData>(
  { projectRef, functionId, interval }: FunctionsReqStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<FunctionsReqStatsData, FunctionsReqStatsError, TData> = {}
) =>
  useQuery<FunctionsReqStatsData, FunctionsReqStatsError, TData>(
    analyticsKeys.functionsReqStats(projectRef, { functionId, interval }),
    ({ signal }) => getFunctionsReqStats({ projectRef, functionId, interval }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof functionId !== 'undefined' &&
        typeof interval !== 'undefined',
      ...options,
    }
  )

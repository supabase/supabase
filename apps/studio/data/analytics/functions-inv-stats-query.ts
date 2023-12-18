import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type FunctionsInvStatsVariables = {
  projectRef?: string
  functionId?: string
  interval?: string
}

export type FunctionsInvStatsResponse = any

export async function getFunctionsInvStats(
  { projectRef, functionId, interval }: FunctionsInvStatsVariables,
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

  const response = await get<FunctionsInvStatsResponse>(
    `${API_URL}/projects/${projectRef}/analytics/endpoints/functions.inv-stats?interval=${interval}&function_id=${functionId}`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
}

export type FunctionsInvStatsData = Awaited<ReturnType<typeof getFunctionsInvStats>>
export type FunctionsInvStatsError = unknown

export const useFunctionsInvStatsQuery = <TData = FunctionsInvStatsData>(
  { projectRef, functionId, interval }: FunctionsInvStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<FunctionsInvStatsData, FunctionsInvStatsError, TData> = {}
) =>
  useQuery<FunctionsInvStatsData, FunctionsInvStatsError, TData>(
    analyticsKeys.functionsInvStats(projectRef, { functionId, interval }),
    ({ signal }) => getFunctionsInvStats({ projectRef, functionId, interval }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof functionId !== 'undefined' &&
        typeof interval !== 'undefined',
      ...options,
    }
  )

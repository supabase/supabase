import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'

export type FunctionsCombinedStatsVariables = {
  projectRef?: string
  functionId?: string
  interval?: operations['FunctionsLogsController_getCombinedStats']['parameters']['query']['interval']
}

export type FunctionsCombinedStatsResponse = any

export async function getFunctionsCombinedStats(
  { projectRef, functionId, interval }: FunctionsCombinedStatsVariables,
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

  const { data, error } = await get(
    '/platform/projects/{ref}/analytics/endpoints/functions.combined-stats',
    {
      params: {
        path: {
          ref: projectRef,
        },
        query: {
          function_id: functionId,
          interval,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)

  return data
}

export type FunctionsCombinedStatsData = Awaited<ReturnType<typeof getFunctionsCombinedStats>>
export type FunctionsCombinedStatsError = unknown

export const useFunctionsCombinedStatsQuery = <TData = FunctionsCombinedStatsData>(
  { projectRef, functionId, interval }: FunctionsCombinedStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<FunctionsCombinedStatsData, FunctionsCombinedStatsError, TData> = {}
) =>
  useQuery<FunctionsCombinedStatsData, FunctionsCombinedStatsError, TData>(
    analyticsKeys.functionsCombinedStats(projectRef, { functionId, interval }),
    ({ signal }) => getFunctionsCombinedStats({ projectRef, functionId, interval }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof functionId !== 'undefined' &&
        typeof interval !== 'undefined',
      ...options,
    }
  )

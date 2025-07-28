import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'

export type FunctionsReqStatsVariables = {
  projectRef?: string
  functionId?: string
  interval?: operations['FunctionRequestLogsController_getStatus']['parameters']['query']['interval']
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

  const { data, error } = await get(
    '/platform/projects/{ref}/analytics/endpoints/functions.req-stats',
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

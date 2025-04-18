import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'

export type FunctionsResourceUsageVariables = {
  projectRef?: string
  functionId?: string
  interval?: operations['FunctionResourceLogsController_getStatus']['parameters']['query']['interval']
}

export type FunctionsResourceUsageResponse = any

export async function getFunctionsResourceUsage(
  { projectRef, functionId, interval }: FunctionsResourceUsageVariables,
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
    '/platform/projects/{ref}/analytics/endpoints/functions.resource-usage',
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

export type FunctionsResourceUsageData = Awaited<ReturnType<typeof getFunctionsResourceUsage>>
export type FunctionsResourceUsageError = unknown

export const useFunctionsResourceUsageQuery = <TData = FunctionsResourceUsageData>(
  { projectRef, functionId, interval }: FunctionsResourceUsageVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<FunctionsResourceUsageData, FunctionsResourceUsageError, TData> = {}
) =>
  useQuery<FunctionsResourceUsageData, FunctionsResourceUsageError, TData>(
    analyticsKeys.functionsResourceUsage(projectRef, { functionId, interval }),
    ({ signal }) => getFunctionsResourceUsage({ projectRef, functionId, interval }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof functionId !== 'undefined' &&
        typeof interval !== 'undefined',
      ...options,
    }
  )

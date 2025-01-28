import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type FunctionsResourceUsageVariables = {
  projectRef?: string
  functionId?: string
  interval?: string
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

  const response = await get<FunctionsResourceUsageResponse>(
    `${API_URL}/projects/${projectRef}/analytics/endpoints/functions.resource-usage?interval=${interval}&function_id=${functionId}`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response
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

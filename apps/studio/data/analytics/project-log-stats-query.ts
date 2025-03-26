import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'

export type ProjectLogStatsVariables = {
  projectRef?: string
  interval?: operations['UsageApiController_getApiCounts']['parameters']['query']['interval']
}

export type ProjectLogStatsResponse = {
  result: UsageApiCounts[]
}
export interface UsageApiCounts {
  total_auth_requests: number
  total_storage_requests: number
  total_rest_requests: number
  total_realtime_requests: number
  timestamp: string
}

export async function getProjectLogStats(
  { projectRef, interval }: ProjectLogStatsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!interval) {
    throw new Error('interval is required')
  }

  const { data, error } = await get(
    '/platform/projects/{ref}/analytics/endpoints/usage.api-counts',
    {
      params: {
        path: { ref: projectRef },
        query: {
          interval,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)

  return data as unknown as ProjectLogStatsResponse
}

export type ProjectLogStatsData = Awaited<ReturnType<typeof getProjectLogStats>>
export type ProjectLogStatsError = unknown

export const useProjectLogStatsQuery = <TData = ProjectLogStatsData>(
  { projectRef, interval }: ProjectLogStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectLogStatsData, ProjectLogStatsError, TData> = {}
) =>
  useQuery<ProjectLogStatsData, ProjectLogStatsError, TData>(
    analyticsKeys.usageApiCounts(projectRef, interval),
    ({ signal }) => getProjectLogStats({ projectRef, interval }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof interval !== 'undefined',
      ...options,
    }
  )

export function prefetchProjectLogStats(
  client: QueryClient,
  { projectRef, interval }: ProjectLogStatsVariables
) {
  return client.fetchQuery(analyticsKeys.usageApiCounts(projectRef, interval), ({ signal }) =>
    getProjectLogStats({ projectRef, interval }, signal)
  )
}

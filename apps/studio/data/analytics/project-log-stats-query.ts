import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type ProjectLogStatsVariables = {
  projectRef?: string
  interval?: string
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

  const response = await get<ProjectLogStatsResponse>(
    `${API_URL}/projects/${projectRef}/analytics/endpoints/usage.api-counts?interval=${interval}`,
    {
      signal,
    }
  )
  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
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

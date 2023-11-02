import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { analyticsKeys } from './keys'

export type ProjectLogRequestsCountVariables = {
  projectRef?: string
}

export type ProjectLogRequestsCountResponse = {
  result: UsageApiCounts[]
}
export interface UsageApiCounts {
  count: number
}

export async function getProjectLogRequestsCountStats(
  { projectRef }: ProjectLogRequestsCountVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get<ProjectLogRequestsCountResponse>(
    `${API_URL}/projects/${projectRef}/analytics/endpoints/usage.api-requests-count`,
    {
      signal,
    }
  )
  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

export type ProjectLogRequestsCountData = Awaited<
  ReturnType<typeof getProjectLogRequestsCountStats>
>
export type ProjectLogRequestsCountError = unknown

export const useProjectLogRequestsCountQuery = <TData = ProjectLogRequestsCountData>(
  { projectRef }: ProjectLogRequestsCountVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectLogRequestsCountData, ProjectLogRequestsCountError, TData> = {}
) =>
  useQuery<ProjectLogRequestsCountData, ProjectLogRequestsCountError, TData>(
    analyticsKeys.usageApiRequestsCount(projectRef),
    ({ signal }) => getProjectLogRequestsCountStats({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

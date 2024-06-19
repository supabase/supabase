import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { analyticsKeys } from './keys'

export type ProjectLogRequestsCountVariables = {
  projectRef?: string
}

export async function getProjectLogRequestsCountStats(
  { projectRef }: ProjectLogRequestsCountVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const { data, error } = await get(
    '/platform/projects/{ref}/analytics/endpoints/usage.api-requests-count',
    {
      params: { path: { ref: projectRef } },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type ProjectLogRequestsCountData = Awaited<
  ReturnType<typeof getProjectLogRequestsCountStats>
>
export type ProjectLogRequestsCountError = ResponseError

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

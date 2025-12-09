import { QueryClient, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
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
  }: UseCustomQueryOptions<ProjectLogRequestsCountData, ProjectLogRequestsCountError, TData> = {}
) =>
  useQuery<ProjectLogRequestsCountData, ProjectLogRequestsCountError, TData>({
    queryKey: analyticsKeys.usageApiRequestsCount(projectRef),
    queryFn: ({ signal }) => getProjectLogRequestsCountStats({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

export function prefetchProjectLogRequestsCount(
  client: QueryClient,
  { projectRef }: ProjectLogRequestsCountVariables
) {
  return client.fetchQuery({
    queryKey: analyticsKeys.usageApiRequestsCount(projectRef),
    queryFn: ({ signal }) => getProjectLogRequestsCountStats({ projectRef }, signal),
  })
}

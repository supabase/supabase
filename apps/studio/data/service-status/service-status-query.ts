import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type ProjectServiceStatusVariables = {
  projectRef?: string
}

export async function getProjectServiceStatus(
  { projectRef }: ProjectServiceStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/health`, {
    params: {
      path: { ref: projectRef },
      query: {
        services: ['auth', 'realtime', 'rest', 'storage'],
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectServiceStatusData = Awaited<ReturnType<typeof getProjectServiceStatus>>
export type ProjectServiceStatusError = ResponseError

export const useProjectServiceStatusQuery = <TData = ProjectServiceStatusData>(
  { projectRef }: ProjectServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectServiceStatusData, ProjectServiceStatusError, TData> = {}
) =>
  useQuery<ProjectServiceStatusData, ProjectServiceStatusError, TData>(
    serviceStatusKeys.serviceStatus(projectRef),
    ({ signal }) => getProjectServiceStatus({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

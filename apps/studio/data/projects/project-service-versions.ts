import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectServiceVersionsVariables = {
  projectRef?: string
}

export async function getProjectServiceVersions(
  { projectRef }: ProjectServiceVersionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/platform/projects/{ref}/service-versions`, {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type ProjectServiceVersionsData = Awaited<ReturnType<typeof getProjectServiceVersions>>
export type ProjectServiceVersionsError = ResponseError

export const useProjectServiceVersionsQuery = <TData = ProjectServiceVersionsData>(
  { projectRef }: ProjectServiceVersionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectServiceVersionsData, ProjectServiceVersionsError, TData> = {}
) =>
  useQuery<ProjectServiceVersionsData, ProjectServiceVersionsError, TData>(
    projectKeys.serviceVersions(projectRef),
    ({ signal }) => getProjectServiceVersions({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

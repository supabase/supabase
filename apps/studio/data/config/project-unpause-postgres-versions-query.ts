import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectUnpausePostgresVersionsVariables = {
  projectRef?: string
}

export async function getPostgresUnpauseVersions(
  { projectRef }: ProjectUnpausePostgresVersionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/restore/versions', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectUnpausePostgresVersionData = Awaited<
  ReturnType<typeof getPostgresUnpauseVersions>
>
export type ProjectUnpausePostgresVersionError = ResponseError

export const useProjectUnpausePostgresVersionsQuery = <TData = ProjectUnpausePostgresVersionData>(
  { projectRef }: ProjectUnpausePostgresVersionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    ProjectUnpausePostgresVersionData,
    ProjectUnpausePostgresVersionError,
    TData
  > = {}
) => {
  return useQuery<ProjectUnpausePostgresVersionData, ProjectUnpausePostgresVersionError, TData>(
    configKeys.projectUnpausePostgresVersions(projectRef),
    ({ signal }) => getPostgresUnpauseVersions({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
}

import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { configKeys } from './keys'
import { components } from 'api-types'
import { ResponseError } from 'types'

export type ProjectUnpausePostgresVersionsVariables = {
  projectRef?: string
}

export type ProjectUnpausePostgresVersion = components['schemas']['ProjectUnpauseVersionInfo']
export type ReleaseChannel = components['schemas']['ReleaseChannel']
export type PostgresEngine = components['schemas']['PostgresEngine']

export type ProjectUnpausePostgresVersionsResponse = {
  available_versions: ProjectUnpausePostgresVersion[]
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
  return data as ProjectUnpausePostgresVersionsResponse
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

import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectPostgrestConfigVariables = {
  projectRef?: string
}

export async function getProjectPostgrestConfig(
  { projectRef }: ProjectPostgrestConfigVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/config/postgrest', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type ProjectPostgrestConfigData = Awaited<ReturnType<typeof getProjectPostgrestConfig>>
export type ProjectPostgrestConfigError = ResponseError

export const useProjectPostgrestConfigQuery = <TData = ProjectPostgrestConfigData>(
  { projectRef }: ProjectPostgrestConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectPostgrestConfigData, ProjectPostgrestConfigError, TData> = {}
) =>
  useQuery<ProjectPostgrestConfigData, ProjectPostgrestConfigError, TData>(
    configKeys.postgrest(projectRef),
    ({ signal }) => getProjectPostgrestConfig({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

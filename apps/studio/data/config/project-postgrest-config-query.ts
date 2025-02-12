import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectPostgrestConfigVariables = {
  projectRef?: string
}

type PostgrestConfigResponse = components['schemas']['PostgrestConfigResponse'] & {
  db_pool: number | null
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
  // [Joshen] Not sure why but db_pool isn't part of the API typing
  // https://github.com/supabase/infrastructure/blob/develop/api/src/routes/platform/projects/ref/config/postgrest.dto.ts#L6
  return data as unknown as PostgrestConfigResponse
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

import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectPostgrestConfigVariables = {
  orgSlug?: string
  projectRef?: string
}

type PostgrestConfigResponse = components['schemas']['GetPostgrestConfigResponse'] & {
  db_pool: number | null
}

export async function getProjectPostgrestConfig(
  { orgSlug, projectRef }: ProjectPostgrestConfigVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/config/postgrest', {
    params: { path: { slug: orgSlug, ref: projectRef } },
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
  { orgSlug, projectRef }: ProjectPostgrestConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectPostgrestConfigData, ProjectPostgrestConfigError, TData> = {}
) =>
  useQuery<ProjectPostgrestConfigData, ProjectPostgrestConfigError, TData>(
    configKeys.postgrest(orgSlug, projectRef),
    ({ signal }) => getProjectPostgrestConfig({ orgSlug, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined',
      ...options,
    }
  )

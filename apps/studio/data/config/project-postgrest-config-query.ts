import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { configKeys } from './keys'

/**
 * Parses the exposed schema string returned from PostgREST config.
 *
 * @param schemaString - e.g., `public,graphql_public`
 */
export const parseDbSchemaString = (schemaString: string): string[] => {
  return schemaString
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export type ProjectPostgrestConfigVariables = {
  projectRef?: string
}

type PostgrestConfigResponse = components['schemas']['GetPostgrestConfigResponse'] & {
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
  // https://github.com/supabase/platform/blob/develop/api/src/routes/platform/projects/ref/config/postgrest.dto.ts#L6
  return data as unknown as PostgrestConfigResponse
}

export type ProjectPostgrestConfigData = Awaited<ReturnType<typeof getProjectPostgrestConfig>>
export type ProjectPostgrestConfigError = ResponseError

export const useProjectPostgrestConfigQuery = <TData = ProjectPostgrestConfigData>(
  { projectRef }: ProjectPostgrestConfigVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectPostgrestConfigData, ProjectPostgrestConfigError, TData> = {}
) =>
  useQuery<ProjectPostgrestConfigData, ProjectPostgrestConfigError, TData>({
    queryKey: configKeys.postgrest(projectRef),
    queryFn: ({ signal }) => getProjectPostgrestConfig({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

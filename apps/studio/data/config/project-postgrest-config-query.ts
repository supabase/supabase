import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { configKeys } from './keys'

export type ProjectPostgrestConfigVariables = {
  projectRef?: string
}

export type ProjectPostgrestConfigResponse = {
  max_rows: number
  role_claim_key: string
  db_schema: string
  db_anon_role: string
  db_extra_search_path: string
  db_pool: number | null
  jwt_secret: string
}

export async function getProjectPostgrestConfig(
  { projectRef }: ProjectPostgrestConfigVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get(`${API_URL}/projects/${projectRef}/config/postgrest`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as ProjectPostgrestConfigResponse
}

export type ProjectPostgrestConfigData = Awaited<ReturnType<typeof getProjectPostgrestConfig>>
export type ProjectPostgrestConfigError = unknown

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

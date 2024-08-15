import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectSettingsVariables = {
  projectRef?: string
}

// [Joshen] API typing needs to be fixed - this is completely wrong
type ProjectSettingsInfo = components['schemas']['ProjectResponse'] & { db_port: number }
interface ProjectSettingsInfoExtended extends ProjectSettingsInfo {
  // [Joshen] Based on the enums here
  // https://github.com/supabase/infrastructure/blob/95dc09fe077dba7817bb112fa72b6814a620ecd3/shared/src/projects.ts#L177
  db_ip_addr_config: 'legacy' | 'static-ipv4' | 'concurrent-ipv6' | 'ipv6'
}

export type ProjectSettings = {
  project: ProjectSettingsInfoExtended
  services: components['schemas']['SettingsResponse']['services']
}

export async function getProjectSettings(
  { projectRef }: ProjectSettingsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  // [Joshen] API typing is wrong here
  const { data, error } = await get('/platform/props/project/{ref}/settings', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as ProjectSettings
}

export type ProjectSettingsData = Awaited<ReturnType<typeof getProjectSettings>>
export type ProjectSettingsError = ResponseError

export const useProjectSettingsQuery = <TData = ProjectSettingsData>(
  { projectRef }: ProjectSettingsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectSettingsData, ProjectSettingsError, TData> = {}
) =>
  useQuery<ProjectSettingsData, ProjectSettingsError, TData>(
    configKeys.settings(projectRef),
    ({ signal }) => getProjectSettings({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      refetchInterval(data) {
        const apiService = ((data as ProjectSettings)?.services ?? []).find(
          (x) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID
        )
        const apiKeys = apiService?.service_api_keys ?? []
        const interval = apiKeys.length === 0 ? 2000 : 0

        return interval
      },
      ...options,
    }
  )

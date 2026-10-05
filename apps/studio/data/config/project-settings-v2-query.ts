import { useQuery } from '@tanstack/react-query'

import { configKeys } from './keys'
import type { components } from '@/data/api'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'
import { useAsyncCheckPermissionsV2, FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'

export type ProjectSettingsVariables = { projectRef?: string }

// Manually add the protocol property to the response - specifically just for the local/CLI environment
type ProjectAppConfig = components['schemas']['ProjectSettingsResponse_Output']['app_config'] & {
  protocol?: string
}
export type ProjectSettings = components['schemas']['ProjectSettingsResponse_Output'] & {
  app_config?: ProjectAppConfig
}

export async function getProjectSettings(
  { projectRef }: ProjectSettingsVariables,
  signal?: AbortSignal,
  headers?: Record<string, string>
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/settings', {
    params: { path: { ref: projectRef } },
    signal,
    headers,
  })

  if (error) handleError(error)
  return data as unknown as ProjectSettings
}

type ProjectSettingsData = Awaited<ReturnType<typeof getProjectSettings>>
type ProjectSettingsError = ResponseError

export const useProjectSettingsV2Query = <TData = ProjectSettingsData>(
  { projectRef }: ProjectSettingsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectSettingsData, ProjectSettingsError, TData> = {}
) => {
  // [Joshen] Sync with API perms checking here - shouldReturnApiKeys
  // https://github.com/supabase/platform/blob/develop/api/src/routes/platform/projects/ref/settings.controller.ts#L92
  const { can: canReadAPIKeys } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ
  )

  return useQuery<ProjectSettingsData, ProjectSettingsError, TData>({
    queryKey: configKeys.settingsV2(projectRef),
    queryFn: ({ signal }) => getProjectSettings({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchInterval: (query) => {
      const data = query.state.data
      const apiKeys = data?.service_api_keys ?? []
      const interval =
        canReadAPIKeys && data?.status !== 'INACTIVE' && apiKeys.length === 0 ? 2000 : 0
      return interval
    },
    ...options,
  })
}

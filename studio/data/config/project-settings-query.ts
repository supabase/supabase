import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL, DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import { useCallback } from 'react'
import { configKeys } from './keys'

export type ProjectSettingsVariables = {
  projectRef?: string
}

export type Project = {
  id: number
  name: string
  ref: string
  status: string
  inserted_at: string
  db_dns_name: string
  db_port: number
  db_name: string
  db_ssl: boolean
  db_host: string
  db_user: string
  cloud_provider: string
  region: string
  services: Service[]
  jwt_secret: string
}

export type Service = {
  id: number
  name: string
  app_config: AppConfig
  app: App
  service_api_keys: ServiceApiKey[]
}

export type AppConfig = {
  protocol: 'https' | 'http'
  endpoint: string
  db_schema: string
  realtime_multitenant_enabled: boolean
}

export type App = {
  id: number
  name: string
}

export type ServiceApiKey = {
  api_key_encrypted: string
  tags: string
  name: string
  api_key: string
}

export type ProjectSettingsResponse = {
  project: Project
  services: Service[]
}

export async function getProjectSettings(
  { projectRef }: ProjectSettingsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get(`${API_URL}/props/project/${projectRef}/settings`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as ProjectSettingsResponse
}

export type ProjectSettingsData = Awaited<ReturnType<typeof getProjectSettings>>
export type ProjectSettingsError = unknown

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
      refetchInterval(data, query) {
        const apiService = (
          (data as unknown as ProjectSettingsData | undefined)?.services ?? []
        ).find((x) => x.app.id == DEFAULT_PROJECT_API_SERVICE_ID)
        const apiKeys = apiService?.service_api_keys ?? []
        const interval = apiKeys.length === 0 ? 2000 : 0

        return interval
      },
      ...options,
    }
  )

export const useProjectSettingsPrefetch = ({ projectRef }: ProjectSettingsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(configKeys.settings(projectRef), ({ signal }) =>
        getProjectSettings({ projectRef }, signal)
      )
    }
  }, [projectRef])
}

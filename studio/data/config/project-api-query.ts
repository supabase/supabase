import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { configKeys } from './keys'
import { ResponseError } from 'types'

export type ProjectApiVariables = {
  projectRef?: string
}

export type Project = {
  id: number
  name: string
  ref: string
  status: string
  db_host: string
  db_name: string
  db_user: string
  db_schema: string
  db_port: number
  db_ssl: boolean
  services: Service[]
}

export type App = {
  id: number
  name: string
}

export type AppConfig = {
  endpoint: string
  db_schema: string
  realtime_multitenant_enabled: boolean
}

export type Service = {
  id: number
  name: string
  app_config: AppConfig
  app: App
  service_api_keys: ServiceApiKey[]
}

export type ServiceApiKey = {
  api_key_encrypted: string
  tags: string
  name: string
}

export type AutoApiService = Service & {
  protocol: 'https' | 'http'
  endpoint: string
  restUrl: string
  project: Project
  defaultApiKey: string
  serviceApiKey: string
}

export type ProjectApiResponse = {
  project: Project
  autoApiService: AutoApiService
}

export async function getProjectApi({ projectRef }: ProjectApiVariables, signal?: AbortSignal) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get(`${API_URL}/props/project/${projectRef}/api`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as ProjectApiResponse
}

export type ProjectApiData = Awaited<ReturnType<typeof getProjectApi>>
export type ProjectApiError = ResponseError

export const useProjectApiQuery = <TData = ProjectApiData>(
  { projectRef }: ProjectApiVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectApiData, ProjectApiError, TData> = {}
) =>
  useQuery<ProjectApiData, ProjectApiError, TData>(
    configKeys.api(projectRef),
    ({ signal }) => getProjectApi({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      refetchInterval(data, query) {
        if (!data) {
          return false
        }

        const { autoApiService } = data as unknown as ProjectApiData

        const apiKeys = autoApiService?.service_api_keys ?? []
        const interval = apiKeys.length === 0 ? 2000 : 0

        return interval
      },
      ...options,
    }
  )

export const useProjectApiPrefetch = ({ projectRef }: ProjectApiVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(configKeys.api(projectRef), ({ signal }) =>
        getProjectApi({ projectRef }, signal)
      )
    }
  }, [projectRef])
}

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { configKeys } from './keys'

export type ProjectStorageConfigVariables = {
  projectRef?: string
}

// TODO: Add proper type
export type ProjectStorageConfigResponse = any

export async function getProjectStorageConfig(
  { projectRef }: ProjectStorageConfigVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get(`${API_URL}/projects/${projectRef}/config/storage`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as ProjectStorageConfigResponse
}

export type ProjectStorageConfigData = Awaited<ReturnType<typeof getProjectStorageConfig>>
export type ProjectStorageConfigError = unknown

export const useProjectStorageConfigQuery = <TData = ProjectStorageConfigData>(
  { projectRef }: ProjectStorageConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectStorageConfigData, ProjectStorageConfigError, TData> = {}
) =>
  useQuery<ProjectStorageConfigData, ProjectStorageConfigError, TData>(
    configKeys.storage(projectRef),
    ({ signal }) => getProjectStorageConfig({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useProjectStorageConfigPrefetch = ({ projectRef }: ProjectStorageConfigVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(configKeys.storage(projectRef), ({ signal }) =>
        getProjectStorageConfig({ projectRef }, signal)
      )
    }
  }, [projectRef])
}

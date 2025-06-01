import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'
import { IS_PLATFORM } from 'lib/constants'

export type ProjectStorageConfigVariables = {
  projectRef?: string
}

export type ProjectStorageConfigResponse = components['schemas']['StorageConfigResponse']

export async function getProjectStorageConfig(
  { projectRef }: ProjectStorageConfigVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/config/storage', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectStorageConfigData = Awaited<ReturnType<typeof getProjectStorageConfig>>
export type ProjectStorageConfigError = ResponseError

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
    { enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined', ...options }
  )

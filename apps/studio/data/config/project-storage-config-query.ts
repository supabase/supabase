import { useQuery } from '@tanstack/react-query'
import { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { configKeys } from './keys'

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

  if (error) {
    // [Joshen] This is due to API not returning an error message on this endpoint if a 404 is returned
    // Should only be a temporary patch, needs to be addressed on the API end
    if ((error as any).code === 404) {
      handleError({ ...(error as any), message: 'Storage configuration not found.' })
    } else {
      handleError(error)
    }
  }
  return data
}

export type ProjectStorageConfigData = Awaited<ReturnType<typeof getProjectStorageConfig>>
export type ProjectStorageConfigError = ResponseError

export const useProjectStorageConfigQuery = <TData = ProjectStorageConfigData>(
  { projectRef }: ProjectStorageConfigVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectStorageConfigData, ProjectStorageConfigError, TData> = {}
) =>
  useQuery<ProjectStorageConfigData, ProjectStorageConfigError, TData>({
    queryKey: configKeys.storage(projectRef),
    queryFn: ({ signal }) => getProjectStorageConfig({ projectRef }, signal),
    enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined' && projectRef !== '_',
    ...options,
  })

export const useIsAnalyticsBucketsEnabled = ({ projectRef }: { projectRef?: string }) => {
  const { data } = useProjectStorageConfigQuery({ projectRef })
  const isIcebergCatalogEnabled = !!data?.features.icebergCatalog?.enabled
  return isIcebergCatalogEnabled
}

export const useIsVectorBucketsEnabled = ({ projectRef }: { projectRef?: string }) => {
  const { data } = useProjectStorageConfigQuery({ projectRef })
  const isVectorBucketsEnabled = !!data?.features.vectorBuckets?.enabled
  return isVectorBucketsEnabled
}

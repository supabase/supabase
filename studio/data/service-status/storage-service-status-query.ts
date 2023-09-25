import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type StorageServiceStatusVariables = {
  projectRef?: string
}

export async function getStorageServiceStatus(
  { projectRef }: StorageServiceStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { error } = await get(`/platform/storage/{ref}/buckets`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) throw error
  return error === undefined
}

export type StorageServiceStatusData = Awaited<ReturnType<typeof getStorageServiceStatus>>
export type StorageServiceStatusError = ResponseError

export const useStorageServiceStatusQuery = <TData = StorageServiceStatusData>(
  { projectRef }: StorageServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<StorageServiceStatusData, StorageServiceStatusError, TData> = {}
) =>
  useQuery<StorageServiceStatusData, StorageServiceStatusError, TData>(
    serviceStatusKeys.storage(projectRef),
    ({ signal }) => getStorageServiceStatus({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

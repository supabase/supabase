import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageKeys } from './keys'

type StorageArchiveVariables = { projectRef?: string }

async function fetchStorageArchive({ projectRef }: StorageArchiveVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/storage/{ref}/archive', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    if ((error as ResponseError)?.message?.includes('Storage archive not found')) {
      return { fileUrl: undefined }
    } else {
      handleError(error)
    }
  }
  return data
}

export type StorageArchiveData = Awaited<ReturnType<typeof fetchStorageArchive>>

export const useStorageArchiveQuery = <TData = StorageArchiveData>(
  { projectRef }: StorageArchiveVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<StorageArchiveData, ResponseError, TData> = {}
) =>
  useQuery<StorageArchiveData, ResponseError, TData>({
    queryKey: storageKeys.archive(projectRef),
    queryFn: ({ signal }) => fetchStorageArchive({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

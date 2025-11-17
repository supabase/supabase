import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageCredentialsKeys } from './s3-access-key-keys'

type StorageCredentialsVariables = { projectRef?: string }

export type S3AccessKey = components['schemas']['GetStorageCredentialsResponse']['data'][number] & {
  access_key: string
}

async function fetchStorageCredentials(
  { projectRef }: StorageCredentialsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/storage/{ref}/credentials', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data as { data: S3AccessKey[] }
}

export type StorageCredentialsData = Awaited<ReturnType<typeof fetchStorageCredentials>>

export const useStorageCredentialsQuery = <TData = StorageCredentialsData>(
  { projectRef }: StorageCredentialsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<StorageCredentialsData, ResponseError, TData> = {}
) =>
  useQuery<StorageCredentialsData, ResponseError, TData>({
    queryKey: storageCredentialsKeys.credentials(projectRef),
    queryFn: ({ signal }) => fetchStorageCredentials({ projectRef }, signal),
    enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined',
    ...options,
  })

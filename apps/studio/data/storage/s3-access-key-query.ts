import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { storageCredentialsKeys } from './s3-access-key-keys'

type StorageCredentialsVariables = { projectRef?: string }

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

  // Generated types by openapi are wrong so we need to cast it.
  return data as unknown as {
    data: {
      id: string
      created_at: string
      access_key: string
      description: string
    }[]
  }
}

export type StorageCredentialsData = Awaited<ReturnType<typeof fetchStorageCredentials>>

export const useStorageCredentialsQuery = <TData = StorageCredentialsData>(
  { projectRef }: StorageCredentialsVariables,
  { enabled = true, ...options }: UseQueryOptions<StorageCredentialsData, ResponseError, TData> = {}
) =>
  useQuery<StorageCredentialsData, ResponseError, TData>(
    storageCredentialsKeys.credentials(projectRef),
    ({ signal }) => fetchStorageCredentials({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'lib/common/fetch'
import { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type StorageServiceStatusVariables = {
  projectRef?: string
  endpoint?: string
  anonKey?: string
}

export async function getStorageServiceStatus(
  { projectRef, endpoint, anonKey }: StorageServiceStatusVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!endpoint) throw new Error('endpoint is required')
  if (!anonKey) throw new Error('anonKey is required')

  const response = await get(`https://${endpoint}/storage/v1/bucket`, {
    signal,
    headers: { Authorization: `Bearer ${anonKey}` },
  })

  return response.error === undefined
}

export type StorageServiceStatusData = Awaited<ReturnType<typeof getStorageServiceStatus>>
export type StorageServiceStatusError = ResponseError

export const useStorageServiceStatusQuery = <TData = StorageServiceStatusData>(
  { projectRef, endpoint, anonKey }: StorageServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<StorageServiceStatusData, StorageServiceStatusError, TData> = {}
) =>
  useQuery<StorageServiceStatusData, StorageServiceStatusError, TData>(
    serviceStatusKeys.storage(projectRef),
    ({ signal }) => getStorageServiceStatus({ projectRef, endpoint, anonKey }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof endpoint !== 'undefined' &&
        typeof anonKey !== 'undefined',
      ...options,
    }
  )

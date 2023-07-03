import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { storageKeys } from './keys'

export type BucketsVariables = { projectRef?: string }

export type Bucket = {
  id: string
  name: string
  owner: string
  public: boolean
  created_at: string
  updated_at: string
  file_size_limit: null | number
  allowed_mime_types: null | string[]
}

export async function getBuckets({ projectRef }: BucketsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await get(`${API_URL}/storage/${projectRef}/buckets`, { signal })
  if (response.error) throw response.error
  return response as Bucket[]
}

export type BucketsData = Awaited<ReturnType<typeof getBuckets>>
export type BucketsError = unknown

export const useBucketsQuery = <TData = BucketsData>(
  { projectRef }: BucketsVariables,
  { enabled = true, ...options }: UseQueryOptions<BucketsData, BucketsError, TData> = {}
) =>
  useQuery<BucketsData, BucketsError, TData>(
    storageKeys.buckets(projectRef),
    ({ signal }) => getBuckets({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useBucketsPrefetch = ({ projectRef }: BucketsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(storageKeys.buckets(projectRef), ({ signal }) =>
        getBuckets({ projectRef }, signal)
      )
    }
  }, [projectRef])
}

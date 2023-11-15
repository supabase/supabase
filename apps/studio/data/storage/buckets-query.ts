import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { storageKeys } from './keys'
import { ResponseError } from 'types'

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

  const { data, error } = await get('/platform/storage/{ref}/buckets', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) throw error
  return data as Bucket[]
}

export type BucketsData = Awaited<ReturnType<typeof getBuckets>>
export type BucketsError = ResponseError

export const useBucketsQuery = <TData = BucketsData>(
  { projectRef }: BucketsVariables,
  { enabled = true, ...options }: UseQueryOptions<BucketsData, BucketsError, TData> = {}
) =>
  useQuery<BucketsData, BucketsError, TData>(
    storageKeys.buckets(projectRef),
    ({ signal }) => getBuckets({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
      retry: (failureCount, error) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          error.message.startsWith('Tenant config') &&
          error.message.endsWith('not found')
        ) {
          return false
        }

        if (failureCount < 3) {
          return true
        }

        return false
      },
    }
  )

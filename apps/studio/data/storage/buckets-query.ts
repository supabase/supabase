import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

export type BucketsVariables = { projectRef?: string }

export type Bucket = components['schemas']['StorageBucketResponse']

export type BucketType = Bucket['type']

export async function getBuckets({ projectRef }: BucketsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/storage/{ref}/buckets', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data as Bucket[]
}

export type BucketsData = Awaited<ReturnType<typeof getBuckets>>
export type BucketsError = ResponseError

export const useBucketsQuery = <TData = BucketsData>(
  { projectRef }: BucketsVariables,
  { enabled = true, ...options }: UseQueryOptions<BucketsData, BucketsError, TData> = {}
) => {
  const project = useSelectedProject()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<BucketsData, BucketsError, TData>(
    storageKeys.buckets(projectRef),
    ({ signal }) => getBuckets({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && isActive,
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
}

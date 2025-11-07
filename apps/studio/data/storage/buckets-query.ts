import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { MAX_RETRY_FAILURE_COUNT } from 'data/query-client'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { ResponseError, type UseCustomQueryOptions } from 'types'
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
  { enabled = true, ...options }: UseCustomQueryOptions<BucketsData, BucketsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<BucketsData, BucketsError, TData>({
    queryKey: storageKeys.buckets(projectRef),
    queryFn: ({ signal }) => getBuckets({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
    retry: (failureCount, error) => {
      if (error instanceof ResponseError && error.message.includes('Missing tenant config')) {
        return false
      }

      if (failureCount < MAX_RETRY_FAILURE_COUNT) {
        return true
      }

      return false
    },
  })
}

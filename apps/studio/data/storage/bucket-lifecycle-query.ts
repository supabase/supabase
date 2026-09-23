import { queryOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { storageKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type BucketLifecycle = components['schemas']['BucketLifecycleResponse_Output']
export type BucketLifecycleRule = BucketLifecycle['rules'][number]

export type BucketLifecycleVariables = {
  projectRef?: string
  bucketId?: string
}

export type BucketLifecycleError = ResponseError

/** No stored configuration answers 404, which is "no policy" rather than a query error. */
async function getBucketLifecycle(
  { projectRef, bucketId }: BucketLifecycleVariables,
  signal?: AbortSignal
): Promise<BucketLifecycle | null> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await get('/platform/storage/{ref}/buckets/{id}/lifecycle', {
    params: { path: { ref: projectRef, id: bucketId } },
    signal,
  })

  if (error) {
    if ((error as { code?: number }).code === 404) return null
    handleError(error)
  }

  return data ?? null
}

export type BucketLifecycleData = Awaited<ReturnType<typeof getBucketLifecycle>>

export const bucketLifecycleQueryOptions = ({ projectRef, bucketId }: BucketLifecycleVariables) =>
  queryOptions({
    queryKey: storageKeys.bucketLifecycle(projectRef, bucketId),
    queryFn: ({ signal }) => getBucketLifecycle({ projectRef, bucketId }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof bucketId !== 'undefined',
  })

import { queryOptions } from '@tanstack/react-query'

import { storageKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type BucketObjectPublicUrlVariables = {
  projectRef?: string
  bucketId?: string
  path: string
  /** Resolves a specific version of the object. Defaults to the current one. */
  versionId?: string
}

async function getBucketObjectPublicUrl(
  { projectRef, bucketId, path, versionId }: BucketObjectPublicUrlVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  // Omitted rather than sent as `undefined`, so current-version requests are unchanged.
  const options = versionId === undefined ? undefined : { versionId }

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/public-url', {
    params: { path: { ref: projectRef, id: bucketId } },
    body: { path, options },
    signal,
  })

  if (error) handleError(error)
  return data.publicUrl
}

export type BucketObjectPublicUrlData = Awaited<ReturnType<typeof getBucketObjectPublicUrl>>
export type BucketObjectPublicUrlError = ResponseError

// Shares its key with the file URL of a public bucket, so both resolve to the same cached string.
export const bucketObjectPublicUrlQueryOptions = ({
  projectRef,
  bucketId,
  path,
  versionId,
}: BucketObjectPublicUrlVariables) =>
  queryOptions({
    queryKey: storageKeys.fileUrl({ projectRef, isBucketPublic: true, bucketId, path, versionId }),
    queryFn: ({ signal }) =>
      getBucketObjectPublicUrl({ projectRef, bucketId, path, versionId }, signal),
    enabled: typeof projectRef !== 'undefined' && typeof bucketId !== 'undefined',
  })

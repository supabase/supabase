import { useQuery } from '@tanstack/react-query'

import { getPublicUrlForBucketObject } from '@/data/storage/bucket-object-get-public-url-mutation'
import { signBucketObject } from '@/data/storage/bucket-object-sign-mutation'
import { Bucket } from '@/data/storage/buckets-query'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

const DEFAULT_EXPIRY = 7 * 24 * 60 * 60 // in seconds, default to 1 week

export const fetchFileUrl = async (
  pathToFile: string,
  projectRef: string,
  bucketId: string,
  isBucketPublic: boolean,
  expiresIn?: number,
  versionId?: string
) => {
  // Omitted entirely rather than sent as `undefined`, so a request for the current
  // version stays byte-identical to what the non-versioned callers send.
  const options = versionId === undefined ? undefined : { versionId }

  if (isBucketPublic) {
    const data = await getPublicUrlForBucketObject({
      projectRef: projectRef,
      bucketId: bucketId,
      path: pathToFile,
      options,
    })
    return data.publicUrl
  } else {
    const data = await signBucketObject({
      projectRef: projectRef,
      bucketId: bucketId,
      path: pathToFile,
      expiresIn: expiresIn ?? DEFAULT_EXPIRY,
      options,
    })
    return data.signedUrl
  }
}

type UseFileUrlQueryVariables = {
  path: string
  projectRef: string
  bucket: Bucket
  /** Resolves a specific version of the object. Defaults to the current one. */
  versionId?: string
}

export const useFetchFileUrlQuery = (
  { path, projectRef, bucket, versionId }: UseFileUrlQueryVariables,
  { ...options }: UseCustomQueryOptions<string, ResponseError> = {}
) => {
  return useQuery<string, ResponseError, string>({
    queryKey: [projectRef, 'buckets', bucket.public, bucket.id, 'file', path, versionId],
    queryFn: () =>
      fetchFileUrl(path, projectRef, bucket.id, bucket.public, DEFAULT_EXPIRY, versionId),
    staleTime: DEFAULT_EXPIRY * 1000,
    ...options,
  })
}

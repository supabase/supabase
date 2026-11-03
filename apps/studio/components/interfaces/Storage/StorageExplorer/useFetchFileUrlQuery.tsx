import { useQuery, type QueryClient } from '@tanstack/react-query'

import { bucketObjectPublicUrlQueryOptions } from '@/data/storage/bucket-object-public-url-query'
import { signBucketObject } from '@/data/storage/bucket-object-sign-mutation'
import { Bucket } from '@/data/storage/buckets-query'
import { storageKeys } from '@/data/storage/keys'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

const DEFAULT_EXPIRY = 7 * 24 * 60 * 60 // in seconds, default to 1 week

export const fetchFileUrl = async (
  client: QueryClient,
  pathToFile: string,
  projectRef: string,
  bucketId: string,
  isBucketPublic: boolean,
  expiresIn?: number,
  versionId?: string
) => {
  if (isBucketPublic) {
    return client.query(
      bucketObjectPublicUrlQueryOptions({ projectRef, bucketId, path: pathToFile, versionId })
    )
  } else {
    // Omitted rather than sent as `undefined`, so current-version requests are unchanged.
    const options = versionId === undefined ? undefined : { versionId }
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
    queryKey: storageKeys.fileUrl({
      projectRef,
      isBucketPublic: bucket.public,
      bucketId: bucket.id,
      path,
      versionId,
    }),
    queryFn: ({ client }) =>
      fetchFileUrl(client, path, projectRef, bucket.id, bucket.public, DEFAULT_EXPIRY, versionId),
    staleTime: DEFAULT_EXPIRY * 1000,
    ...options,
  })
}

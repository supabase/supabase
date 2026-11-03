import { useQuery } from '@tanstack/react-query'

import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import { getBucketObjectPublicUrl } from '@/data/storage/bucket-object-public-url-query'
import { signBucketObject } from '@/data/storage/bucket-object-sign-mutation'
import { Bucket } from '@/data/storage/buckets-query'
import { storageKeys } from '@/data/storage/keys'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

const DEFAULT_EXPIRY = 7 * 24 * 60 * 60 // in seconds, default to 1 week

export const fetchFileUrl = async ({
  projectRef,
  clientEndpoint,
  bucketId,
  isBucketPublic,
  path,
  expiresIn = DEFAULT_EXPIRY,
  versionId,
}: {
  projectRef: string
  clientEndpoint: string
  bucketId: string
  isBucketPublic: boolean
  path: string
  expiresIn?: number
  versionId?: string
}) => {
  if (isBucketPublic) {
    return getBucketObjectPublicUrl({ projectRef, clientEndpoint, bucketId, path, versionId })
  }

  const data = await signBucketObject({
    projectRef,
    clientEndpoint,
    bucketId,
    path,
    expiresIn,
    versionId,
  })
  return data.signedUrl
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
  { enabled = true, ...options }: UseCustomQueryOptions<string, ResponseError> = {}
) => {
  const { hostEndpoint } = useProjectApiUrl({ projectRef })

  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- hostEndpoint is derived from projectRef
  return useQuery<string, ResponseError, string>({
    queryKey: storageKeys.fileUrl({
      projectRef,
      isBucketPublic: bucket.public,
      bucketId: bucket.id,
      path,
      versionId,
    }),
    queryFn: () =>
      fetchFileUrl({
        projectRef,
        clientEndpoint: hostEndpoint!,
        bucketId: bucket.id,
        isBucketPublic: bucket.public,
        path,
        versionId,
      }),
    staleTime: DEFAULT_EXPIRY * 1000,
    enabled: enabled && !!hostEndpoint,
    ...options,
  })
}

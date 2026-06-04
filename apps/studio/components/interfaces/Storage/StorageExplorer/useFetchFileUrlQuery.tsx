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
  expiresIn?: number
) => {
  if (isBucketPublic) {
    const data = await getPublicUrlForBucketObject({
      projectRef: projectRef,
      bucketId: bucketId,
      path: pathToFile,
    })
    return data.publicUrl
  } else {
    const data = await signBucketObject({
      projectRef: projectRef,
      bucketId: bucketId,
      path: pathToFile,
      expiresIn: expiresIn ?? DEFAULT_EXPIRY,
    })
    return data.signedUrl
  }
}

type UseFileUrlQueryVariables = {
  path: string
  projectRef: string
  bucket: Bucket
}

export const useFetchFileUrlQuery = (
  { path, projectRef, bucket }: UseFileUrlQueryVariables,
  { ...options }: UseCustomQueryOptions<string, ResponseError> = {}
) => {
  return useQuery<string, ResponseError, string>({
    queryKey: [projectRef, 'buckets', bucket.public, bucket.id, 'file', path],
    queryFn: () => fetchFileUrl(path, projectRef, bucket.id, bucket.public, DEFAULT_EXPIRY),
    staleTime: DEFAULT_EXPIRY * 1000,
    ...options,
  })
}

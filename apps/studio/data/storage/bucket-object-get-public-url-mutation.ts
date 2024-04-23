import { useMutation } from '@tanstack/react-query'

import { components } from 'data/api'
import { handleError, post } from 'data/fetchers'

type getPublicUrlForBucketObjectParams = {
  projectRef: string
  bucketId?: string
  path: string
  options?: components['schemas']['PublicUrlOptions']
}
export const getPublicUrlForBucketObject = async (
  { projectRef, bucketId, path, options }: getPublicUrlForBucketObjectParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/public-url', {
    params: {
      path: {
        ref: projectRef,
        id: bucketId,
      },
    },
    body: { path, options },
    signal,
  })

  if (error) handleError(error)
  return data
}

export function useBucketObjectGetPublicUrlMutation() {
  return useMutation({
    mutationFn: getPublicUrlForBucketObject,
  })
}

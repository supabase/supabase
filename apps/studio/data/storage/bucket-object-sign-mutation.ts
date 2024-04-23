import { useMutation } from '@tanstack/react-query'

import { components } from 'data/api'
import { handleError, post } from 'data/fetchers'

type signBucketObjectParams = {
  projectRef: string
  bucketId?: string
  path: string
  expiresIn: number
  options?: components['schemas']['SignedUrlOptions']
}
export const signBucketObject = async (
  { projectRef, bucketId, path, expiresIn, options }: signBucketObjectParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/sign', {
    params: {
      path: {
        ref: projectRef,
        id: bucketId,
      },
    },
    body: { path, expiresIn, options },
    signal,
  })

  if (error) handleError(error)
  return data
}

export function useSignBucketObjectMutation() {
  return useMutation({
    mutationFn: signBucketObject,
  })
}

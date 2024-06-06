import { UseMutationOptions, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'

type SignBucketObjectParams = {
  projectRef: string
  bucketId?: string
  path: string
  expiresIn: number
  options?: components['schemas']['SignedUrlOptions']
}
export const signBucketObject = async (
  { projectRef, bucketId, path, expiresIn, options }: SignBucketObjectParams,
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

type SignBucketObjectData = Awaited<ReturnType<typeof signBucketObject>>

export const useGetSignBucketObjectMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SignBucketObjectData, ResponseError, SignBucketObjectParams>,
  'mutationFn'
> = {}) => {
  return useMutation<SignBucketObjectData, ResponseError, SignBucketObjectParams>(
    (vars) => signBucketObject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to get sign bucket object: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

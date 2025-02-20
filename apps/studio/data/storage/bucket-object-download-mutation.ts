import { UseMutationOptions, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'data/api'
import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { ResponseError } from 'types'

type DownloadBucketObjectParams = {
  projectRef: string
  bucketId?: string
  path: string
  options?: components['schemas']['DownloadObjectOptions']
}
export const downloadBucketObject = async (
  { projectRef, bucketId, path, options }: DownloadBucketObjectParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  // [Joshen] JFYI we have to use lib/common/fetch post as post from openapi-fetch doesn't support receiving octet-streams
  // Opting to hard code /platform for non platform just for this particular mutation, so that it's clear what's happening
  const response = await post(
    `${API_URL}${IS_PLATFORM ? '' : '/platform'}/storage/${projectRef}/buckets/${bucketId}/objects/download`,
    {
      path,
      options,
      abortSignal: signal,
    }
  )

  if (response.error) throw response.error
  return response
}

type BucketObjectDeleteData = Awaited<ReturnType<typeof downloadBucketObject>>

export const useBucketObjectDownloadMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketObjectDeleteData, ResponseError, DownloadBucketObjectParams>,
  'mutationFn'
> = {}) => {
  return useMutation<BucketObjectDeleteData, ResponseError, DownloadBucketObjectParams>(
    (vars) => downloadBucketObject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to download bucket object: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

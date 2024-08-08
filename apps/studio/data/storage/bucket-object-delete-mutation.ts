import { UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { del, handleError } from 'data/fetchers'
import { toast } from 'sonner'
import { ResponseError } from 'types'

type DeleteBucketObjectParams = {
  projectRef: string
  bucketId?: string
  paths: string[]
}
export const deleteBucketObject = async (
  { projectRef, bucketId, paths }: DeleteBucketObjectParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await del('/platform/storage/{ref}/buckets/{id}/objects', {
    params: {
      path: {
        ref: projectRef,
        id: bucketId,
      },
    },
    body: {
      paths,
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type BucketObjectDeleteData = Awaited<ReturnType<typeof deleteBucketObject>>

export const useBucketObjectDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketObjectDeleteData, ResponseError, DeleteBucketObjectParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BucketObjectDeleteData, ResponseError, DeleteBucketObjectParams>(
    (vars) => deleteBucketObject(vars),
    {
      async onSuccess(data, variables, context) {
        // [Joshen] TODO figure out what queries to invalidate
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete bucket object: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

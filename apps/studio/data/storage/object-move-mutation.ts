import { UseMutationOptions, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'

type MoveStorageObjectParams = {
  projectRef: string
  bucketId?: string
  from: string
  to: string
}
export const moveStorageObject = async ({
  projectRef,
  bucketId,
  from,
  to,
}: MoveStorageObjectParams) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/move', {
    params: {
      path: {
        ref: projectRef,
        id: bucketId,
      },
    },
    body: {
      from,
      to,
    },
  })

  if (error) handleError(error)
  return data
}

type MoveBucketObjectData = Awaited<ReturnType<typeof moveStorageObject>>

export const useGetSignBucketObjectMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<MoveBucketObjectData, ResponseError, MoveStorageObjectParams>,
  'mutationFn'
> = {}) => {
  return useMutation<MoveBucketObjectData, ResponseError, MoveStorageObjectParams>(
    (vars) => moveStorageObject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to move bucket object: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

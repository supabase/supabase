import { UseMutationOptions, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'

type ListBucketObjectsParams = {
  projectRef: string
  bucketId?: string
  path: string
  options: components['schemas']['StorageObjectSearchOptions']
}

export type StorageObject = components['schemas']['StorageObject']

// [Joshen] Ideally we transform this into a query that uses a POST i think
export const listBucketObjects = async (
  { projectRef, bucketId, path, options }: ListBucketObjectsParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/list', {
    params: {
      path: {
        ref: projectRef,
        id: bucketId,
      },
    },
    body: {
      path,
      options,
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type ListBucketObjectsData = Awaited<ReturnType<typeof listBucketObjects>>

export const useGetSignBucketObjectMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ListBucketObjectsData, ResponseError, ListBucketObjectsParams>,
  'mutationFn'
> = {}) => {
  return useMutation<ListBucketObjectsData, ResponseError, ListBucketObjectsParams>(
    (vars) => listBucketObjects(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to list bucket objects: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

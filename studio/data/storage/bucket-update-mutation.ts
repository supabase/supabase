import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'data/fetchers'
import { ResponseError } from 'types'
import { storageKeys } from './keys'

export type BucketUpdateVariables = {
  projectRef: string
  id: string
  isPublic: boolean
  fileSizeLimit: number
  allowedMimeTypes: string[]
}

export async function updateBucket({
  projectRef,
  id,
  isPublic,
  fileSizeLimit,
  allowedMimeTypes,
}: BucketUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is required')

  const { data, error } = await patch('/platform/storage/{ref}/buckets/{id}', {
    params: {
      path: {
        ref: projectRef,
        id: id,
      },
    },
    body: {
      public: isPublic,
      file_size_limit: fileSizeLimit,
      allowed_mime_types: allowedMimeTypes,
    },
  })

  if (error) throw error
  return data
}

type BucketUpdateData = Awaited<ReturnType<typeof updateBucket>>

export const useBucketUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketUpdateData, ResponseError, BucketUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketUpdateData, ResponseError, BucketUpdateVariables>(
    (vars) => updateBucket(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(storageKeys.buckets(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update bucket: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

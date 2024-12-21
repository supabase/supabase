import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

export type BucketUpdateVariables = {
  projectRef: string
  id: string
  isPublic: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
}

export async function updateBucket({
  projectRef,
  id,
  isPublic,
  file_size_limit,
  allowed_mime_types,
}: BucketUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is required')

  const { data, error } = await patch(`/platform/storage/{ref}/buckets/{id}`, {
    params: {
      path: {
        id,
        ref: projectRef,
      },
    },
    body: {
      public: isPublic,
      // @ts-expect-error - file_size_limit is actually optional
      file_size_limit,
      // @ts-expect-error - allowed_mime_types is actually optional
      allowed_mime_types,
    },
  })

  if (error) handleError(error)
  return data // as unknown as { name: string }
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

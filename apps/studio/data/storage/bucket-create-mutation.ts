import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

export type BucketCreateVariables = {
  projectRef: string
  id: string
  isPublic: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
}

export async function createBucket({
  projectRef,
  id,
  isPublic,
  file_size_limit,
  allowed_mime_types,
}: BucketCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is required')

  const { data, error } = await post(`/platform/storage/{ref}/buckets`, {
    params: {
      path: {
        ref: projectRef,
      },
    },
    body: {
      id,
      public: isPublic,
      // @ts-expect-error - file_size_limit is actually optional
      file_size_limit,
      // @ts-expect-error - allowed_mime_types is actually optional
      allowed_mime_types,
    },
  })

  if (error) handleError(error)

  // data is actually {name: string}
  return data as unknown as { name: string }
}

type BucketCreateData = Awaited<ReturnType<typeof createBucket>>

export const useBucketCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketCreateData, ResponseError, BucketCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketCreateData, ResponseError, BucketCreateVariables>(
    (vars) => createBucket(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(storageKeys.buckets(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create bucket: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

type BucketUpdateVariables = {
  projectRef: string
  id: string
  isPublic: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
}

// [Alaister]: API accept null values for allowed_mime_types and file_size_limit to reset
type UpdateStorageBucketBody = Omit<
  components['schemas']['UpdateStorageBucketBody'],
  'allowed_mime_types' | 'file_size_limit'
> & {
  allowed_mime_types: string[] | null
  file_size_limit: number | null
}

async function updateBucket({
  projectRef,
  id,
  isPublic,
  file_size_limit,
  allowed_mime_types,
}: BucketUpdateVariables): Promise<BucketUpdateResult> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is requried')

  const payload: Partial<UpdateStorageBucketBody> = { public: isPublic }
  if (file_size_limit !== undefined) payload.file_size_limit = file_size_limit
  if (allowed_mime_types !== undefined) payload.allowed_mime_types = allowed_mime_types

  const { data, error } = await patch('/platform/storage/{ref}/buckets/{id}', {
    params: { path: { id, ref: projectRef } },
    body: payload as any,
  })

  if (error) {
    // Return the error instead of throwing it, so we can handle it gracefully
    return { data: null, error }
  }

  return { data, error: null }
}

type BucketUpdateResult = { data: any; error: null } | { data: null; error: any }
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
    async (vars) => {
      const result = await updateBucket(vars)
      if (result.error) {
        throw result.error
      }
      return result.data
    },
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

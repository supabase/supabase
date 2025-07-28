import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

export type BucketCreateVariables = Omit<CreateStorageBucketBody, 'public'> & {
  projectRef: string
  isPublic: boolean
}

type CreateStorageBucketBody = components['schemas']['CreateStorageBucketBody']

export async function createBucket({
  projectRef,
  id,
  type,
  isPublic,
  file_size_limit,
  allowed_mime_types,
}: BucketCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is required')

  const payload: CreateStorageBucketBody = { id, type, public: isPublic }
  if (type === 'STANDARD') {
    if (file_size_limit) payload.file_size_limit = file_size_limit
    if (allowed_mime_types) payload.allowed_mime_types = allowed_mime_types
  }

  const { data, error } = await post('/platform/storage/{ref}/buckets', {
    params: { path: { ref: projectRef } },
    body: payload,
  })

  if (error) handleError(error)
  return data as { name: string }
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

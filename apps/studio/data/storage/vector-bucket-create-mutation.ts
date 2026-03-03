import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

type VectorBucketCreateVariables = {
  projectRef: string
  bucketName: string
}

async function createVectorBucket({ projectRef, bucketName }: VectorBucketCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketName) throw new Error('Bucket name is required')

  const { data, error } = await post('/platform/storage/{ref}/vector-buckets', {
    params: { path: { ref: projectRef } },
    body: { bucketName: bucketName },
  })

  if (error) handleError(error)

  // [Joshen] JFYI typed incorrectly in API, to fix
  return data as { name: string }
}

type VectorBucketCreateData = Awaited<ReturnType<typeof createVectorBucket>>

export const useVectorBucketCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<VectorBucketCreateData, ResponseError, VectorBucketCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VectorBucketCreateData, ResponseError, VectorBucketCreateVariables>({
    mutationFn: (vars) => createVectorBucket(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: storageKeys.vectorBuckets(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create vector bucket: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

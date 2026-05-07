import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

type VectorBucketDeleteVariables = {
  projectRef: string
  bucketName: string
}

async function deleteVectorBucket({ projectRef, bucketName }: VectorBucketDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketName) throw new Error('Bucket name is required')

  const { data, error } = await del('/platform/storage/{ref}/vector-buckets/{id}', {
    params: { path: { ref: projectRef, id: bucketName } },
  })

  if (error) handleError(error)

  // [Joshen] JFYI typed incorrectly in API, to fix
  return data as { name: string }
}

type VectorBucketDeleteData = Awaited<ReturnType<typeof deleteVectorBucket>>

export const useVectorBucketDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<VectorBucketDeleteData, ResponseError, VectorBucketDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VectorBucketDeleteData, ResponseError, VectorBucketDeleteVariables>({
    mutationFn: (vars) => deleteVectorBucket(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: storageKeys.vectorBuckets(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete vector bucket: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

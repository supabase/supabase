import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

type VectorBucketIndexDeleteVariables = {
  projectRef: string
  bucketName: string
  indexName: string
}

export async function deleteVectorBucketIndex({
  projectRef,
  bucketName,
  indexName,
}: VectorBucketIndexDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketName) throw new Error('Bucket name is required')
  if (!indexName) throw new Error('Index name is required')

  const { data, error } = await del(
    '/platform/storage/{ref}/vector-buckets/{id}/indexes/{indexName}',
    {
      params: { path: { ref: projectRef, id: bucketName, indexName } },
    }
  )

  if (error) handleError(error)

  // [Joshen] JFYI typed incorrectly in API, to fix
  return data as { name: string }
}

type VectorBucketIndexDeleteData = Awaited<ReturnType<typeof deleteVectorBucketIndex>>

export const useVectorBucketIndexDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<VectorBucketIndexDeleteData, ResponseError, VectorBucketIndexDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VectorBucketIndexDeleteData, ResponseError, VectorBucketIndexDeleteVariables>({
    mutationFn: (vars) => deleteVectorBucketIndex(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, bucketName } = variables
      await queryClient.invalidateQueries({
        queryKey: storageKeys.vectorBucketsIndexes(projectRef, bucketName),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete vector bucket index: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

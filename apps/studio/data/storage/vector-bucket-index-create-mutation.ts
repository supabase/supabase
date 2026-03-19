import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

type VectorBucketIndexCreateVariables = components['schemas']['CreateBucketIndexBody'] & {
  projectRef: string
  bucketName: string
}

async function createVectorBucketIndex({
  projectRef,
  bucketName,
  ...rest
}: VectorBucketIndexCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketName) throw new Error('Bucket name is required')

  const { data, error } = await post('/platform/storage/{ref}/vector-buckets/{id}/indexes', {
    params: { path: { ref: projectRef, id: bucketName } },
    body: {
      dataType: 'float32',
      dimension: rest.dimension,
      distanceMetric: rest.distanceMetric,
      indexName: rest.indexName,
      metadataKeys: rest.metadataKeys,
    },
  })

  if (error) handleError(error)

  // [Joshen] JFYI typed incorrectly in API, to fix
  return data as { name: string }
}

type VectorBucketIndexCreateData = Awaited<ReturnType<typeof createVectorBucketIndex>>

export const useVectorBucketIndexCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<VectorBucketIndexCreateData, ResponseError, VectorBucketIndexCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VectorBucketIndexCreateData, ResponseError, VectorBucketIndexCreateVariables>({
    mutationFn: (vars) => createVectorBucketIndex(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, bucketName } = variables
      await queryClient.invalidateQueries({
        queryKey: storageKeys.vectorBucketsIndexes(projectRef, bucketName),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create vector bucket index: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

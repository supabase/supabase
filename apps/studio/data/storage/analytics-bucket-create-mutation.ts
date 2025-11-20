import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type AnalyticsBucketCreateVariables = CreateAnalyticsBucketBody & {
  projectRef: string
}

type CreateAnalyticsBucketBody = components['schemas']['CreateStorageAnalyticsBucketBody']

async function createAnalyticsBucket({ projectRef, bucketName }: AnalyticsBucketCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketName) throw new Error('Bucket name is required')

  const { data, error } = await post('/platform/storage/{ref}/analytics-buckets', {
    params: { path: { ref: projectRef } },
    body: { bucketName },
  })

  if (error) handleError(error)
  return data
}

type AnalyticsBucketCreateData = Awaited<ReturnType<typeof createAnalyticsBucket>>

export const useAnalyticsBucketCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    AnalyticsBucketCreateData,
    ResponseError,
    AnalyticsBucketCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AnalyticsBucketCreateData, ResponseError, AnalyticsBucketCreateVariables>({
    mutationFn: (vars) => createAnalyticsBucket(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: storageKeys.analyticsBuckets(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create analytics bucket: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

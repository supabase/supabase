import { useMutation, useQueryClient } from '@tanstack/react-query'
import { components } from 'api-types'
import { toast } from 'sonner'

import { storageKeys } from './keys'
import { del, handleError, put } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type UpdateBucketLifecycleBody = components['schemas']['UpdateBucketLifecycleBody']
export type BucketLifecycleRuleInput = UpdateBucketLifecycleBody['rules'][number]

export type BucketLifecycleUpdateVariables = {
  projectRef: string
  bucketId: string
  /** An empty list removes the configuration — the API has no "zero rules" body. */
  rules: BucketLifecycleRuleInput[]
}

async function updateBucketLifecycle({
  projectRef,
  bucketId,
  rules,
}: BucketLifecycleUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  if (rules.length === 0) {
    const { error } = await del('/platform/storage/{ref}/buckets/{id}/lifecycle', {
      params: { path: { ref: projectRef, id: bucketId } },
    })
    if (error) handleError(error)
    return null
  }

  const { data, error } = await put('/platform/storage/{ref}/buckets/{id}/lifecycle', {
    params: { path: { ref: projectRef, id: bucketId } },
    body: { rules },
  })

  if (error) handleError(error)
  return data
}

export type BucketLifecycleUpdateData = Awaited<ReturnType<typeof updateBucketLifecycle>>

export const useBucketLifecycleUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    BucketLifecycleUpdateData,
    ResponseError,
    BucketLifecycleUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketLifecycleUpdateData, ResponseError, BucketLifecycleUpdateVariables>({
    mutationFn: updateBucketLifecycle,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.bucketLifecycle(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update the retention policy: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}

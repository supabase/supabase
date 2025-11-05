import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

export type BucketEmptyVariables = {
  projectRef: string
  id: string
}

export async function emptyBucket({ projectRef, id }: BucketEmptyVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is requried')

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/empty', {
    params: { path: { id, ref: projectRef } },
  })

  if (error) handleError(error)
  return data
}

type BucketEmptyData = Awaited<ReturnType<typeof emptyBucket>>

export const useBucketEmptyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<BucketEmptyData, ResponseError, BucketEmptyVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketEmptyData, ResponseError, BucketEmptyVariables>({
    mutationFn: (vars) => emptyBucket(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: storageKeys.buckets(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to empty bucket: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

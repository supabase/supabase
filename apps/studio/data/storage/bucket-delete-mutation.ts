import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { BucketType } from './buckets-query'
import { storageKeys } from './keys'

export type BucketDeleteVariables = {
  projectRef: string
  id: string
  type: BucketType
}

export async function deleteBucket({ projectRef, id, type }: BucketDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is requried')

  if (type !== 'ANALYTICS') {
    const { error: emptyBucketError } = await post('/platform/storage/{ref}/buckets/{id}/empty', {
      params: { path: { ref: projectRef, id } },
    })
    if (emptyBucketError) handleError(emptyBucketError)
  }

  const { data, error: deleteBucketError } = await del('/platform/storage/{ref}/buckets/{id}', {
    params: { path: { ref: projectRef, id }, query: { type } },
  } as any)
  if (deleteBucketError) handleError(deleteBucketError)
  return data
}

type BucketDeleteData = Awaited<ReturnType<typeof deleteBucket>>

export const useBucketDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketDeleteData, ResponseError, BucketDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketDeleteData, ResponseError, BucketDeleteVariables>(
    (vars) => deleteBucket(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(storageKeys.buckets(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete bucket: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

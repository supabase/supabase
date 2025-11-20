import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { storageKeys } from './keys'

type AnalyticsBucketDeleteVariables = {
  projectRef: string
  id: string
}

async function deleteAnalyticsBucket({ projectRef, id }: AnalyticsBucketDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is requried')

  const { data, error } = await del('/platform/storage/{ref}/analytics-buckets/{id}', {
    params: { path: { ref: projectRef, id } },
  } as any)

  if (error) handleError(error)
  return data
}

type AnalyticsBucketDeleteData = Awaited<ReturnType<typeof deleteAnalyticsBucket>>

export const useAnalyticsBucketDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    AnalyticsBucketDeleteData,
    ResponseError,
    AnalyticsBucketDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AnalyticsBucketDeleteData, ResponseError, AnalyticsBucketDeleteVariables>({
    mutationFn: (vars) => deleteAnalyticsBucket(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: storageKeys.analyticsBuckets(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete analytics bucket: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

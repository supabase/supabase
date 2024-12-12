import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, del } from 'data/fetchers'

export type DeleteSinkParams = {
  projectRef: string
  sinkId: number
}

async function deleteSink({ projectRef, sinkId }: DeleteSinkParams, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del('/platform/replication/{ref}/sinks/{sink_id}', {
    params: { path: { ref: projectRef, sink_id: sinkId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type DeleteSinkData = Awaited<ReturnType<typeof deleteSink>>

export const useDeleteSinkMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeleteSinkData, ResponseError, DeleteSinkParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteSinkData, ResponseError, DeleteSinkParams>((vars) => deleteSink(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef, sinkId } = variables
      await queryClient.invalidateQueries(replicationKeys.sinks(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete sink: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}

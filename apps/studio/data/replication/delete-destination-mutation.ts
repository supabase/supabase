import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, del } from 'data/fetchers'

export type DeleteDestinationParams = {
  projectRef: string
  destinationId: number
}

async function deleteDestination(
  { projectRef, destinationId: destinationId }: DeleteDestinationParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del('/platform/replication/{ref}/destinations/{destination_id}', {
    params: { path: { ref: projectRef, destination_id: destinationId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type DeleteDestinationData = Awaited<ReturnType<typeof deleteDestination>>

export const useDeleteDestinationMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeleteDestinationData, ResponseError, DeleteDestinationParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteDestinationData, ResponseError, DeleteDestinationParams>(
    (vars) => deleteDestination(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, destinationId } = variables
        await queryClient.invalidateQueries(replicationKeys.destinations(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete destination: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

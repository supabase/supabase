import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { replicationKeys } from './keys'

export type DeleteDestinationPipelineParams = {
  projectRef: string
  destinationId: number
  pipelineId: number
}

async function deleteDestinationPipeline(
  { projectRef, destinationId, pipelineId }: DeleteDestinationPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await del(
    '/platform/replication/{ref}/destinations-pipelines/{destination_id}/{pipeline_id}',
    {
      params: { path: { ref: projectRef, destination_id: destinationId, pipeline_id: pipelineId } },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data
}

type DeleteDestinationPipelineData = Awaited<ReturnType<typeof deleteDestinationPipeline>>

export const useDeleteDestinationPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeleteDestinationPipelineData, ResponseError, DeleteDestinationPipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DeleteDestinationPipelineData, ResponseError, DeleteDestinationPipelineParams>(
    (vars) => deleteDestinationPipeline(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, destinationId, pipelineId } = variables

        await Promise.all([
          queryClient.invalidateQueries(replicationKeys.destinations(projectRef)),
          queryClient.invalidateQueries(replicationKeys.pipelines(projectRef)),
          queryClient.invalidateQueries(replicationKeys.pipelineById(projectRef, pipelineId)),
          queryClient.invalidateQueries(replicationKeys.pipelinesStatus(projectRef, pipelineId)),
          queryClient.invalidateQueries(
            replicationKeys.pipelinesReplicationStatus(projectRef, pipelineId)
          ),
          queryClient.invalidateQueries(replicationKeys.destinationById(projectRef, destinationId)),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete destination and pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

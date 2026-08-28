import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  buildPipelineApiConfig,
  buildUpdateDestinationApiConfig,
  DestinationConfig,
  PipelineConfig,
} from './create-destination-pipeline-mutation'
import { replicationKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type UpdateDestinationPipelineParams = {
  destinationId: number
  pipelineId: number
  projectRef: string
  destinationName: string
  destinationConfig: DestinationConfig
  sourceId: number
  pipelineConfig: PipelineConfig
}

async function updateDestinationPipeline(
  {
    destinationId: destinationId,
    pipelineId,
    projectRef,
    destinationName: destinationName,
    destinationConfig,
    pipelineConfig,
    sourceId,
  }: UpdateDestinationPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const destination_config = buildUpdateDestinationApiConfig(destinationConfig)

  const pipeline_config = buildPipelineApiConfig(pipelineConfig)

  const { data, error } = await post(
    '/platform/replication/{ref}/destinations-pipelines/{destination_id}/{pipeline_id}',
    {
      params: { path: { ref: projectRef, destination_id: destinationId, pipeline_id: pipelineId } },
      body: {
        destination_config,
        source_id: sourceId,
        destination_name: destinationName,
        pipeline_config,
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type UpdateDestinationPipelineData = Awaited<ReturnType<typeof updateDestinationPipeline>>

export const useUpdateDestinationPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    UpdateDestinationPipelineData,
    ResponseError,
    UpdateDestinationPipelineParams
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateDestinationPipelineData, ResponseError, UpdateDestinationPipelineParams>(
    {
      mutationFn: (vars) => updateDestinationPipeline(vars),
      async onSuccess(data, variables, context) {
        const { projectRef, destinationId, pipelineId } = variables

        await Promise.all([
          // Invalidate lists
          queryClient.invalidateQueries({ queryKey: replicationKeys.destinations(projectRef) }),
          queryClient.invalidateQueries({ queryKey: replicationKeys.pipelines(projectRef) }),
          // Invalidate item-level caches used by the editor panel
          queryClient.invalidateQueries({
            queryKey: replicationKeys.destinationById(projectRef, destinationId),
          }),
          queryClient.invalidateQueries({
            queryKey: replicationKeys.pipelineById(projectRef, pipelineId),
          }),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update destination or pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

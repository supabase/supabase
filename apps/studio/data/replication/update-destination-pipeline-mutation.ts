import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type BigQueryDestinationConfig = {
  projectId: string
  datasetId: string
  serviceAccountKey: string
  maxStalenessMins: number
}

export type UpdateDestinationPipelineParams = {
  destinationId: number
  pipelineId: number
  projectRef: string
  destinationName: string
  destinationConfig: {
    bigQuery: BigQueryDestinationConfig
  }
  sourceId: number
  publicationName: string
  pipelinConfig: { config: { maxSize: number; maxFillSecs: number } }
}

async function updateDestinationPipeline(
  {
    destinationId: destinationId,
    pipelineId,
    projectRef,
    destinationName: destinationName,
    destinationConfig: {
      bigQuery: { projectId, datasetId, serviceAccountKey, maxStalenessMins },
    },
    pipelinConfig: {
      config: { maxSize, maxFillSecs },
    },
    publicationName,
    sourceId,
  }: UpdateDestinationPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(
    '/platform/replication/{ref}/destinations-pipelines/{destination_id}/{pipeline_id}',
    {
      params: { path: { ref: projectRef, destination_id: destinationId, pipeline_id: pipelineId } },
      body: {
        destination_name: destinationName,
        destination_config: {
          big_query: {
            project_id: projectId,
            dataset_id: datasetId,
            service_account_key: serviceAccountKey,
            max_staleness_mins: maxStalenessMins,
          },
        },
        pipeline_config: {
          config: {
            max_size: maxSize,
            max_fill_secs: maxFillSecs,
          },
        },
        publication_name: publicationName,
        source_id: sourceId,
      },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data
}

type UpdateDestinationPipelineData = Awaited<ReturnType<typeof updateDestinationPipeline>>

export const useUpdateDestinationPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateDestinationPipelineData, ResponseError, UpdateDestinationPipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateDestinationPipelineData, ResponseError, UpdateDestinationPipelineParams>(
    (vars) => updateDestinationPipeline(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(replicationKeys.destinations(projectRef))
        await queryClient.invalidateQueries(replicationKeys.pipelines(projectRef))
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

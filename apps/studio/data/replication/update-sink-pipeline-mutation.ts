import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type BigQuerySinkConfig = {
  projectId: string
  datasetId: string
  serviceAccountKey: string
  maxStalenessMins: number
}

export type UpdateSinkPipelineParams = {
  sinkId: number
  pipelineId: number
  projectRef: string
  sinkName: string
  sinkConfig: {
    bigQuery: BigQuerySinkConfig
  }
  sourceId: number
  publicationName: string
  pipelinConfig: { config: { maxSize: number; maxFillSecs: number } }
}

async function updateSinkPipeline(
  {
    sinkId,
    pipelineId,
    projectRef,
    sinkName,
    sinkConfig: {
      bigQuery: { projectId, datasetId, serviceAccountKey, maxStalenessMins },
    },
    pipelinConfig: {
      config: { maxSize, maxFillSecs },
    },
    publicationName,
    sourceId,
  }: UpdateSinkPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post(
    '/platform/replication/{ref}/sinks-pipelines/{sink_id}/{pipeline_id}',
    {
      params: { path: { ref: projectRef, sink_id: sinkId, pipeline_id: pipelineId } },
      body: {
        sink_name: sinkName,
        sink_config: {
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

type UpdateSinkPipelineData = Awaited<ReturnType<typeof updateSinkPipeline>>

export const useUpdateSinkPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateSinkPipelineData, ResponseError, UpdateSinkPipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateSinkPipelineData, ResponseError, UpdateSinkPipelineParams>(
    (vars) => updateSinkPipeline(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(replicationKeys.sinks(projectRef))
        await queryClient.invalidateQueries(replicationKeys.pipelines(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update sink or pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

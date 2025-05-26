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

export type CreateSinkPipelineParams = {
  projectRef: string
  sinkName: string
  sinkConfig: {
    bigQuery: BigQuerySinkConfig
  }
  sourceId: number
  publicationName: string
  pipelinConfig: { config: { maxSize: number; maxFillSecs: number } }
}

async function createSinkPipeline(
  {
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
  }: CreateSinkPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await post('/platform/replication/{ref}/sinks-pipelines', {
    params: { path: { ref: projectRef } },
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
  })
  if (error) {
    handleError(error)
  }

  return data
}

type CreateSinkPipelineData = Awaited<ReturnType<typeof createSinkPipeline>>

export const useCreateSinkPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CreateSinkPipelineData, ResponseError, CreateSinkPipelineParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateSinkPipelineData, ResponseError, CreateSinkPipelineParams>(
    (vars) => createSinkPipeline(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(replicationKeys.sinks(projectRef))
        await queryClient.invalidateQueries(replicationKeys.pipelines(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create sink or pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

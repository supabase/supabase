import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'

import { replicationKeys } from './keys'

export type DestinationConfig =
  | {
      bigQuery: BigQueryDestinationConfig
    }
  | {
      iceberg: IcebergDestinationConfig
    }

export type BigQueryDestinationConfig = {
  projectId: string
  datasetId: string
  serviceAccountKey: string
  maxStalenessMins?: number
}

export type IcebergDestinationConfig = {
  projectRef: string
  warehouseName: string
  namespace?: string
  catalogToken: string
  s3AccessKeyId: string
  s3SecretAccessKey: string
  s3Region: string
}

export type BatchConfig = {
  maxFillMs?: number
}

export type CreateDestinationPipelineParams = {
  projectRef: string
  destinationName: string
  destinationConfig: DestinationConfig
  sourceId: number
  pipelineConfig: {
    publicationName: string
    batch?: BatchConfig
    maxTableSyncWorkers?: number
    maxCopyConnectionsPerTable?: number
  }
}

async function createDestinationPipeline(
  {
    projectRef,
    destinationName: destinationName,
    destinationConfig,
    pipelineConfig: { publicationName, batch, maxTableSyncWorkers, maxCopyConnectionsPerTable },
    sourceId,
  }: CreateDestinationPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  // Build destination_config based on the type
  let destination_config: components['schemas']['CreateReplicationDestinationPipelineBody']['destination_config']

  if ('bigQuery' in destinationConfig) {
    const { projectId, datasetId, serviceAccountKey, maxStalenessMins } = destinationConfig.bigQuery

    destination_config = {
      big_query: {
        project_id: projectId,
        dataset_id: datasetId,
        service_account_key: serviceAccountKey,
        ...(maxStalenessMins !== null ? { max_staleness_mins: maxStalenessMins } : {}),
      },
    }
  } else if ('iceberg' in destinationConfig) {
    const {
      projectRef: icebergProjectRef,
      namespace,
      warehouseName,
      catalogToken,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Region,
    } = destinationConfig.iceberg

    destination_config = {
      iceberg: {
        supabase: {
          namespace,
          project_ref: icebergProjectRef,
          warehouse_name: warehouseName,
          catalog_token: catalogToken,
          s3_access_key_id: s3AccessKeyId,
          s3_secret_access_key: s3SecretAccessKey,
          s3_region: s3Region,
        },
      },
    }
  } else {
    throw new Error('Invalid destination config: must specify either bigQuery or iceberg')
  }

  const { data, error } = await post('/platform/replication/{ref}/destinations-pipelines', {
    params: { path: { ref: projectRef } },
    body: {
      source_id: sourceId,
      destination_name: destinationName,
      destination_config,
      pipeline_config: {
        publication_name: publicationName,
        ...(maxTableSyncWorkers !== undefined
          ? { max_table_sync_workers: maxTableSyncWorkers }
          : {}),
        ...(maxCopyConnectionsPerTable !== undefined
          ? { max_copy_connections_per_table: maxCopyConnectionsPerTable }
          : {}),
        ...(batch
          ? {
              batch: {
                ...(batch.maxFillMs !== undefined ? { max_fill_ms: batch.maxFillMs } : {}),
              },
            }
          : {}),
      },
    },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type CreateDestinationPipelineData = Awaited<ReturnType<typeof createDestinationPipeline>>

export const useCreateDestinationPipelineMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    CreateDestinationPipelineData,
    ResponseError,
    CreateDestinationPipelineParams
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateDestinationPipelineData, ResponseError, CreateDestinationPipelineParams>(
    {
      mutationFn: (vars) => createDestinationPipeline(vars),
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: replicationKeys.destinations(projectRef) }),
          queryClient.invalidateQueries({ queryKey: replicationKeys.pipelines(projectRef) }),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create destination or pipeline: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}

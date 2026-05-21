import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { BatchConfig, DestinationConfig } from './create-destination-pipeline-mutation'
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
  pipelineConfig: {
    publicationName: string
    batch?: BatchConfig
    maxTableSyncWorkers?: number
    maxCopyConnectionsPerTable?: number
    invalidatedSlotBehavior?: 'error' | 'recreate'
  }
}

async function updateDestinationPipeline(
  {
    destinationId: destinationId,
    pipelineId,
    projectRef,
    destinationName: destinationName,
    destinationConfig,
    pipelineConfig: {
      publicationName,
      batch,
      maxTableSyncWorkers,
      maxCopyConnectionsPerTable,
      invalidatedSlotBehavior,
    },
    sourceId,
  }: UpdateDestinationPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  // Build destination_config based on the type
  let destination_config: components['schemas']['UpdateReplicationDestinationPipelineBody']['destination_config']

  if ('bigQuery' in destinationConfig) {
    const { projectId, datasetId, serviceAccountKey, connectionPoolSize, maxStalenessMins } =
      destinationConfig.bigQuery
    destination_config = {
      big_query: {
        project_id: projectId,
        dataset_id: datasetId,
        service_account_key: serviceAccountKey,
        connection_pool_size: connectionPoolSize,
        max_staleness_mins: maxStalenessMins,
      },
    } as components['schemas']['UpdateReplicationDestinationPipelineBody']['destination_config']
  } else if ('iceberg' in destinationConfig) {
    const {
      projectRef: icebergProjectRef,
      warehouseName,
      namespace,
      catalogToken,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Region,
    } = destinationConfig.iceberg
    destination_config = {
      iceberg: {
        supabase: {
          project_ref: icebergProjectRef,
          warehouse_name: warehouseName,
          namespace: namespace,
          catalog_token: catalogToken,
          s3_access_key_id: s3AccessKeyId,
          s3_secret_access_key: s3SecretAccessKey,
          s3_region: s3Region,
        },
      },
    }
  } else if ('ducklake' in destinationConfig) {
    const {
      catalogUrl,
      dataPath,
      poolSize,
      s3AccessKeyId,
      s3SecretAccessKey,
      s3Region,
      s3Endpoint,
      s3UrlStyle,
      s3UseSsl,
      metadataSchema,
      expireSnapshotsOlderThan,
    } = destinationConfig.ducklake
    destination_config = {
      ducklake: {
        catalog_url: catalogUrl,
        data_path: dataPath,
        pool_size: poolSize,
        s3_access_key_id: s3AccessKeyId,
        s3_secret_access_key: s3SecretAccessKey,
        s3_region: s3Region,
        s3_endpoint: s3Endpoint,
        s3_url_style: s3UrlStyle,
        s3_use_ssl: s3UseSsl,
        metadata_schema: metadataSchema,
        expire_snapshots_older_than: expireSnapshotsOlderThan,
      },
    } as unknown as components['schemas']['UpdateReplicationDestinationPipelineBody']['destination_config']
  } else {
    throw new Error('Invalid destination config: must specify bigQuery, iceberg, or ducklake')
  }

  const pipeline_config = {
    publication_name: publicationName,
    max_table_sync_workers: maxTableSyncWorkers,
    max_copy_connections_per_table: maxCopyConnectionsPerTable,
    invalidated_slot_behavior: invalidatedSlotBehavior,
    batch: batch ? { max_fill_ms: batch.maxFillMs } : undefined,
  }

  const { data, error } = await post(
    '/platform/replication/{ref}/destinations-pipelines/{destination_id}/{pipeline_id}',
    {
      params: { path: { ref: projectRef, destination_id: destinationId, pipeline_id: pipelineId } },
      body: {
        destination_config,
        source_id: sourceId,
        destination_name: destinationName,
        pipeline_config:
          pipeline_config as components['schemas']['UpdateReplicationDestinationPipelineBody']['pipeline_config'],
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

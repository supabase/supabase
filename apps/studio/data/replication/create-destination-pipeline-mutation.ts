import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { replicationKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DestinationConfig =
  | { bigQuery: BigQueryDestinationConfig }
  | { iceberg: IcebergDestinationConfig }
  | { ducklake: DucklakeDestinationConfig }
  | { snowflake: SnowflakeDestinationConfig }

export type BigQueryDestinationConfig = {
  projectId: string
  datasetId: string
  serviceAccountKey: string
  connectionPoolSize?: number
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

// "Custom parameters" DuckLake: caller provides the PostgreSQL catalog URL and the
// S3-compatible storage credentials directly.
export type DucklakeManualDestinationConfig = {
  catalogUrl: string
  dataPath: string
  poolSize?: number
  s3AccessKeyId: string
  s3SecretAccessKey: string
  s3Region: string
  s3Endpoint: string
  s3UrlStyle?: 'path' | 'vhost'
  s3UseSsl?: boolean
  metadataSchema?: string
}

// "Use Supabase" DuckLake: caller provides Supabase project refs and a bucket; the platform
// API resolves these into a catalog URL + provisioned S3 credentials before persisting.
export type DucklakeSupabaseDestinationConfig = {
  catalogProjectRef: string
  storageProjectRef: string
  bucket: string
  path?: string
  poolSize?: number
  metadataSchema?: string
}

export type DucklakeDestinationConfig =
  | DucklakeManualDestinationConfig
  | DucklakeSupabaseDestinationConfig

function isDucklakeSupabaseConfig(
  config: DucklakeDestinationConfig
): config is DucklakeSupabaseDestinationConfig {
  return 'catalogProjectRef' in config
}

// Maps the studio-side DuckLake config to the snake_case `{ ducklake: ... }` payload accepted
// by the platform API. Shared by the create / update / validate mutations.
export function buildDucklakeApiConfig(config: DucklakeDestinationConfig) {
  if (isDucklakeSupabaseConfig(config)) {
    return {
      ducklake: {
        // pool_size / metadata_schema live on the catalog so they apply to the selected
        // Supabase Postgres catalog (the API resolves catalog-level values over top-level).
        catalog: {
          type: 'supabase_project' as const,
          project_ref: config.catalogProjectRef,
          pool_size: config.poolSize,
          metadata_schema: config.metadataSchema,
        },
        storage: {
          type: 'supabase_storage' as const,
          project_ref: config.storageProjectRef,
          bucket: config.bucket,
          ...(config.path ? { path: config.path } : {}),
        },
      },
    }
  }

  return {
    ducklake: {
      catalog_url: config.catalogUrl,
      data_path: config.dataPath,
      pool_size: config.poolSize,
      s3_access_key_id: config.s3AccessKeyId,
      s3_secret_access_key: config.s3SecretAccessKey,
      s3_region: config.s3Region,
      s3_endpoint: config.s3Endpoint,
      s3_url_style: config.s3UrlStyle,
      s3_use_ssl: config.s3UseSsl,
      metadata_schema: config.metadataSchema,
    },
  }
}

export type SnowflakeDestinationConfig = {
  accountId: string
  user: string
  privateKey: string
  privateKeyPassphrase?: string
  database: string
  schema: string
  role?: string
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
    invalidatedSlotBehavior?: 'error' | 'recreate'
  }
}

async function createDestinationPipeline(
  {
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
  }: CreateDestinationPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  // Build destination_config based on the type
  let destination_config: components['schemas']['CreateReplicationDestinationPipelineBody']['destination_config']

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
    } as components['schemas']['CreateReplicationDestinationPipelineBody']['destination_config']
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
  } else if ('ducklake' in destinationConfig) {
    destination_config = buildDucklakeApiConfig(
      destinationConfig.ducklake
    ) as components['schemas']['CreateReplicationDestinationPipelineBody']['destination_config']
  } else if ('snowflake' in destinationConfig) {
    const { accountId, user, privateKey, privateKeyPassphrase, database, schema, role } =
      destinationConfig.snowflake

    destination_config = {
      snowflake: {
        account_id: accountId,
        user,
        private_key: privateKey,
        private_key_passphrase: privateKeyPassphrase,
        database,
        schema,
        role,
      },
    } as unknown as components['schemas']['CreateReplicationDestinationPipelineBody']['destination_config']
  } else {
    throw new Error(
      'Invalid destination config: must specify bigQuery, iceberg, ducklake, or snowflake'
    )
  }

  const pipeline_config = {
    publication_name: publicationName,
    max_table_sync_workers: maxTableSyncWorkers,
    max_copy_connections_per_table: maxCopyConnectionsPerTable,
    invalidated_slot_behavior: invalidatedSlotBehavior,
    batch: batch ? { max_fill_ms: batch.maxFillMs } : undefined,
  }

  const { data, error } = await post('/platform/replication/{ref}/destinations-pipelines', {
    params: { path: { ref: projectRef } },
    body: {
      source_id: sourceId,
      destination_name: destinationName,
      destination_config,
      pipeline_config:
        pipeline_config as components['schemas']['CreateReplicationDestinationPipelineBody']['pipeline_config'],
    },
    signal,
  })

  if (error) handleError(error)
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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { optionalSecret } from './destination-secret-utils'
import { replicationKeys } from './keys'
import type { TableSyncCopyConfig } from '@/components/interfaces/Database/Replication/TableSyncCopy.utils'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type { TableSyncCopyConfig } from '@/components/interfaces/Database/Replication/TableSyncCopy.utils'

export type DestinationConfig =
  | { bigQuery: BigQueryDestinationConfig }
  | { iceberg: IcebergDestinationConfig }
  | { ducklake: DucklakeDestinationConfig }
  | { snowflake: SnowflakeDestinationConfig }
  | { clickHouse: ClickHouseDestinationConfig }

export type BigQueryDestinationConfig = {
  projectId: string
  datasetId: string
  serviceAccountKey: string
  connectionPoolSize?: number
  maxStalenessMins?: number
  tableOptions?: BigQueryTableOption[]
}

export type BigQueryTimePartitionGranularity = 'hour' | 'day' | 'month' | 'year'

export type BigQueryPartitionBy =
  | { kind: 'time_column'; column: string; granularity?: BigQueryTimePartitionGranularity }
  | { kind: 'integer_range'; column: string; start: number; end: number; interval: number }
  | { kind: 'ingestion_time'; granularity?: BigQueryTimePartitionGranularity }

// A single source table's BigQuery partitioning/clustering configuration. `tableId` is the
// source Postgres table OID, stable across renames, matching the id used by the replication
// tables/columns endpoints.
export type BigQueryTableOption = {
  tableId: number
  partitionBy?: BigQueryPartitionBy
  clusterBy?: string[]
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

const maybeOmitBlankSecret = (value: string | undefined, omitBlankSecrets: boolean) => {
  if (omitBlankSecrets) return optionalSecret(value)

  return value
}

const buildBigQueryPartitionByApiConfig = (partitionBy: BigQueryPartitionBy) => {
  switch (partitionBy.kind) {
    case 'time_column':
      return {
        kind: partitionBy.kind,
        column: partitionBy.column,
        granularity: partitionBy.granularity,
      }
    case 'integer_range':
      return {
        kind: partitionBy.kind,
        column: partitionBy.column,
        start: partitionBy.start,
        end: partitionBy.end,
        interval: partitionBy.interval,
      }
    case 'ingestion_time':
      return { kind: partitionBy.kind, granularity: partitionBy.granularity }
  }
}

const buildBigQueryTableOptionApiConfig = (option: BigQueryTableOption) => ({
  table_id: option.tableId,
  partition_by: option.partitionBy && buildBigQueryPartitionByApiConfig(option.partitionBy),
  cluster_by: option.clusterBy,
})

const isBigQueryTableOptionConfigured = (option: BigQueryTableOption) =>
  option.partitionBy !== undefined || (option.clusterBy?.length ?? 0) > 0

// `forUpdate` mirrors `omitBlankSecrets` below: omitting `table_options` on create/validate
// means "none configured", but on update the API only clears a previously-stored value when
// it's sent as `null` rather than omitted, so an update submitted with zero configured tables
// must send `null` explicitly.
const buildBigQueryTableOptionsApiConfig = (
  tableOptions: BigQueryTableOption[] | undefined,
  { forUpdate }: { forUpdate: boolean }
) => {
  const configuredTableOptions = (tableOptions ?? []).filter(isBigQueryTableOptionConfigured)
  if (tableOptions === undefined) return undefined
  if (configuredTableOptions.length === 0) return forUpdate ? null : undefined
  return { tables: configuredTableOptions.map(buildBigQueryTableOptionApiConfig) }
}

// Maps the studio-side BigQuery config to the snake_case `{ big_query: ... }` payload accepted
// by the platform API. Shared by the create / update / validate mutations.
export function buildBigQueryApiConfig(
  config: BigQueryDestinationConfig,
  options: { omitBlankSecrets?: boolean } = {}
) {
  const omitBlankSecrets = options.omitBlankSecrets ?? false

  return {
    big_query: {
      project_id: config.projectId,
      dataset_id: config.datasetId,
      service_account_key: maybeOmitBlankSecret(config.serviceAccountKey, omitBlankSecrets),
      connection_pool_size: config.connectionPoolSize,
      max_staleness_mins: config.maxStalenessMins,
      table_options: buildBigQueryTableOptionsApiConfig(config.tableOptions, {
        forUpdate: omitBlankSecrets,
      }),
    },
  }
}

// Maps the studio-side DuckLake config to the snake_case `{ ducklake: ... }` payload accepted
// by the platform API. Shared by the create / update / validate mutations.
export function buildDucklakeApiConfig(
  config: DucklakeDestinationConfig,
  options: { omitBlankSecrets?: boolean } = {}
) {
  const omitBlankSecrets = options.omitBlankSecrets ?? false

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
      catalog_url: maybeOmitBlankSecret(config.catalogUrl, omitBlankSecrets),
      data_path: config.dataPath,
      pool_size: config.poolSize,
      s3_access_key_id: maybeOmitBlankSecret(config.s3AccessKeyId, omitBlankSecrets),
      s3_secret_access_key: maybeOmitBlankSecret(config.s3SecretAccessKey, omitBlankSecrets),
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

export type ClickHouseDestinationConfig = {
  url: string
  user: string
  password?: string
  database: string
  engine?: 'merge_tree' | 'replacing_merge_tree'
}

export type BatchConfig = {
  maxFillMs?: number
  maxBytes?: number
  memoryBudgetRatio?: number
}

export type PipelineConfig = {
  publicationName: string
  batch?: BatchConfig
  maxTableSyncWorkers?: number
  maxCopyConnectionsPerTable?: number
  invalidatedSlotBehavior?: 'error' | 'recreate'
  tableSyncCopy: TableSyncCopyConfig
}

export const buildPipelineApiConfig = ({
  publicationName,
  batch,
  maxTableSyncWorkers,
  maxCopyConnectionsPerTable,
  invalidatedSlotBehavior,
  tableSyncCopy,
}: PipelineConfig) => ({
  publication_name: publicationName,
  max_table_sync_workers: maxTableSyncWorkers,
  max_copy_connections_per_table: maxCopyConnectionsPerTable,
  invalidated_slot_behavior: invalidatedSlotBehavior,
  table_sync_copy: tableSyncCopy,
  batch: batch
    ? {
        max_fill_ms: batch.maxFillMs,
        max_bytes: batch.maxBytes,
        memory_budget_ratio: batch.memoryBudgetRatio,
      }
    : undefined,
})

export type CreateDestinationPipelineParams = {
  projectRef: string
  destinationName: string
  destinationConfig: DestinationConfig
  sourceId: number
  pipelineConfig: PipelineConfig
}

async function createDestinationPipeline(
  {
    projectRef,
    destinationName: destinationName,
    destinationConfig,
    pipelineConfig,
    sourceId,
  }: CreateDestinationPipelineParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  // Build destination_config based on the type
  let destination_config: components['schemas']['CreateReplicationDestinationPipelineBody']['destination_config']

  if ('bigQuery' in destinationConfig) {
    destination_config = buildBigQueryApiConfig(
      destinationConfig.bigQuery
    ) as components['schemas']['CreateReplicationDestinationPipelineBody']['destination_config']
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
    } as components['schemas']['CreateReplicationDestinationPipelineBody']['destination_config']
  } else if ('clickHouse' in destinationConfig) {
    const { url, user, password, database, engine } = destinationConfig.clickHouse

    destination_config = {
      clickhouse: {
        url,
        user,
        password,
        database,
        engine,
      },
    } as components['schemas']['CreateReplicationDestinationPipelineBody']['destination_config']
  } else {
    throw new Error(
      'Invalid destination config: must specify bigQuery, iceberg, ducklake, snowflake, or clickHouse'
    )
  }

  const pipeline_config = buildPipelineApiConfig(pipelineConfig)

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

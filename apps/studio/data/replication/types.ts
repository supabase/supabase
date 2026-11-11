import { components } from 'api-types'

type CreateDestinationPipelineBody =
  components['schemas']['CreateReplicationDestinationPipelineBody']
export type CreatePipelineApiConfig = CreateDestinationPipelineBody['pipeline_config']

export type BatchConfig = {
  maxFillMs?: number
  maxBytes?: number
  memoryBudgetRatio?: number
}

export type TableSyncCopyConfig = NonNullable<CreatePipelineApiConfig['table_sync_copy']>

export type PipelineConfig = {
  publicationName: string
  batch?: BatchConfig
  maxTableSyncWorkers?: number
  maxCopyConnectionsPerTable?: number
  invalidatedSlotBehavior?: 'error' | 'recreate'
  tableSyncCopy: TableSyncCopyConfig
}

export type DestinationConfig =
  | { bigQuery: BigQueryDestinationConfig }
  | { iceberg: IcebergDestinationConfig }
  | { ducklake: DucklakeDestinationConfig }
  | { snowflake: SnowflakeDestinationConfig }
  | { clickHouse: ClickHouseDestinationConfig }

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

export type BigQueryDestinationConfig = {
  projectId: string
  datasetId: string
  serviceAccountKey: string
  connectionPoolSize?: number
  maxStalenessMins?: number
  tableOptions?: BigQueryTableOption[]
}

export const BIGQUERY_TIME_PARTITION_GRANULARITIES = ['hour', 'day', 'month', 'year'] as const
export const BIGQUERY_MAX_CLUSTERING_COLUMNS = 4

export type BigQueryTimePartitionGranularity =
  (typeof BIGQUERY_TIME_PARTITION_GRANULARITIES)[number]

export type BigQueryPartitionBy =
  | { kind: 'time_column'; column: string; granularity?: BigQueryTimePartitionGranularity }
  | {
      kind: 'integer_range'
      column: string
      start: number | ''
      end: number | ''
      interval: number | ''
    }
  | { kind: 'ingestion_time'; granularity?: BigQueryTimePartitionGranularity }

export type CompleteBigQueryPartitionBy =
  | Exclude<BigQueryPartitionBy, { kind: 'integer_range' }>
  | {
      kind: 'integer_range'
      column: string
      start: number
      end: number
      interval: number
    }

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

import type { DestinationType } from '../DestinationPanel.types'

export const PIPELINE_NAME_FIELD_COPY = {
  label: 'Name',
  description: 'Used to identify this pipeline in Supabase.',
} as const

export const DESTINATION_TYPE_FIELD_COPY = {
  label: 'Type',
  cannotChangeAfterCreation: 'Cannot be changed after creation.',
} as const

export const DESTINATION_TYPE_STAGE_DESCRIPTIONS = {
  'Public Alpha': 'In public alpha and may change.',
  'Early Access': 'In early access and may change.',
  Deprecated: 'This destination type is deprecated.',
} as const

const DESTINATION_TYPE_STAGES: Record<
  DestinationType,
  keyof typeof DESTINATION_TYPE_STAGE_DESCRIPTIONS | null
> = {
  BigQuery: 'Public Alpha',
  DuckLake: 'Early Access',
  Snowflake: 'Early Access',
  ClickHouse: 'Early Access',
  'Analytics Bucket': 'Deprecated',
}

export const getDestinationTypeCreateDescription = (type: DestinationType) => {
  const stage = DESTINATION_TYPE_STAGES[type]
  const stageDescription = stage ? DESTINATION_TYPE_STAGE_DESCRIPTIONS[stage] : null

  if (!stageDescription) {
    return DESTINATION_TYPE_FIELD_COPY.cannotChangeAfterCreation
  }

  return `${DESTINATION_TYPE_FIELD_COPY.cannotChangeAfterCreation} ${stageDescription}`
}

export const BIGQUERY_PROJECT_ID_FIELD_COPY = {
  label: 'Project ID',
  description: 'Google Cloud project ID where data will be sent.',
} as const

export const BIGQUERY_DATASET_ID_FIELD_COPY = {
  label: 'Dataset ID',
  description: 'BigQuery dataset where replicated tables will be created.',
} as const

export const ANALYTICS_BUCKET_BUCKET_FIELD_COPY = {
  label: 'Bucket',
  description: 'The Analytics Bucket where data will be stored',
} as const

export const ANALYTICS_BUCKET_NAMESPACE_FIELD_COPY = {
  label: 'Namespace',
  description: 'The namespace within the bucket where tables will be organized',
} as const

export const DUCKLAKE_CATALOG_PROJECT_FIELD_COPY = {
  label: 'Catalog project',
  description:
    "Pipelines connects to this project's Postgres instance to store the DuckLake catalog",
} as const

export const DUCKLAKE_STORAGE_PROJECT_FIELD_COPY = {
  label: 'Storage project',
  description: 'The project whose object storage holds the DuckLake data files',
} as const

export const DUCKLAKE_BUCKET_FIELD_COPY = {
  label: 'Bucket',
  description: 'The bucket in which DuckLake data files will be stored.',
} as const

export const DUCKLAKE_CATALOG_URL_FIELD_COPY = {
  label: 'Catalog URL',
  createDescription: 'A PostgreSQL connection string for the DuckLake catalog',
  editDescription: 'Stored catalog URL is hidden. Enter a new URL to replace it.',
} as const

export const DUCKLAKE_DATA_PATH_FIELD_COPY = {
  label: 'Data path',
  description: 'An S3 path where DuckLake data files will be written',
} as const

export const SNOWFLAKE_ACCOUNT_ID_FIELD_COPY = {
  label: 'Account ID',
  description: 'Snowflake account identifier, for example ORGNAME-ACCOUNTNAME',
} as const

export const SNOWFLAKE_DATABASE_FIELD_COPY = {
  label: 'Database',
  description: 'Snowflake database where replicated tables will be created',
} as const

export const SNOWFLAKE_SCHEMA_FIELD_COPY = {
  label: 'Schema',
  description: 'Snowflake schema where replicated tables will be created',
} as const

export const CLICKHOUSE_URL_FIELD_COPY = {
  label: 'URL',
  description: 'HTTPS endpoint for your ClickHouse server, including port',
} as const

export const CLICKHOUSE_DATABASE_FIELD_COPY = {
  label: 'Database',
  description: 'The ClickHouse database where replicated tables will be created',
} as const

export const CLICKHOUSE_ENGINE_FIELD_COPY = {
  label: 'Table engine',
  description: 'Server defaults to replacing_merge_tree when unset',
} as const

export const PUBLICATION_FIELD_COPY = {
  label: 'Publication',
  description: 'Tables in the selected publication will be replicated to this destination.',
} as const

export const INITIAL_SYNC_FIELD_COPY = {
  label: 'Initial sync',
  description:
    'Choose which publication tables sync their existing rows. Ongoing replication includes new changes from every publication table, even when initial sync is skipped.',
} as const

export const INITIAL_SYNC_LABELS = {
  include_all_tables: 'All tables',
  skip_all_tables: 'No tables',
  include_tables: 'Selected tables only',
  skip_tables: 'All except selected tables',
} as const satisfies Record<
  'include_all_tables' | 'skip_all_tables' | 'include_tables' | 'skip_tables',
  string
>

export const getTableSyncSelectionDescription = ({
  mode,
  selectedCount,
  tableCount,
}: {
  mode: 'include_tables' | 'skip_tables'
  selectedCount: number
  tableCount: number
}) =>
  mode === 'skip_tables'
    ? `${selectedCount} of ${tableCount} publication tables will skip initial sync. Ongoing replication will still include every publication table.`
    : `${selectedCount} of ${tableCount} publication tables will run initial sync. Ongoing replication will still include every publication table.`

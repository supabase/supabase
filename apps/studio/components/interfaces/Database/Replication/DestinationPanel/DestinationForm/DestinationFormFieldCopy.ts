export const PIPELINE_NAME_FIELD_COPY = {
  label: 'Pipeline name',
  description: 'Used to identify this pipeline in Supabase.',
} as const

export const BIGQUERY_PROJECT_ID_FIELD_COPY = {
  label: 'Project ID',
  description: 'The Google Cloud project ID where data will be sent.',
} as const

export const BIGQUERY_DATASET_ID_FIELD_COPY = {
  label: 'Dataset ID',
  description: 'The BigQuery dataset where replicated tables will be created.',
} as const

export const ANALYTICS_BUCKET_BUCKET_FIELD_COPY = {
  label: 'Bucket',
  description: 'The Analytics Bucket where data will be stored.',
} as const

export const ANALYTICS_BUCKET_NAMESPACE_FIELD_COPY = {
  label: 'Namespace',
  description: 'The namespace within the bucket where tables will be organized.',
} as const

export const DUCKLAKE_CATALOG_PROJECT_FIELD_COPY = {
  label: 'Catalog project',
  description: 'Postgres project that stores this DuckLake’s metadata.',
} as const

export const DUCKLAKE_STORAGE_PROJECT_FIELD_COPY = {
  label: 'Storage project',
  description: 'Supabase project that stores the DuckLake data files.',
} as const

export const DUCKLAKE_BUCKET_FIELD_COPY = {
  label: 'Bucket',
  description: 'Files bucket for DuckLake data.',
} as const

export const DUCKLAKE_CATALOG_URL_FIELD_COPY = {
  label: 'Catalog URL',
  createDescription:
    'Postgres URL for an existing database. Add TLS settings to the URL if required.',
  editDescription: 'Stored catalog URL is hidden. Enter a new URL to replace it.',
} as const

export const DUCKLAKE_DATA_PATH_FIELD_COPY = {
  label: 'Data path',
  description: 'S3 path for DuckLake data files.',
} as const

export const SNOWFLAKE_ACCOUNT_ID_FIELD_COPY = {
  label: 'Account ID',
  description: 'Snowflake organization and account identifiers joined with a hyphen.',
} as const

export const SNOWFLAKE_DATABASE_FIELD_COPY = {
  label: 'Database',
  description: 'Snowflake database where replicated tables are created.',
} as const

export const SNOWFLAKE_SCHEMA_FIELD_COPY = {
  label: 'Schema',
  description: 'An empty Snowflake schema where replicated tables are created.',
} as const

export const CLICKHOUSE_URL_FIELD_COPY = {
  label: 'HTTPS endpoint',
  description: 'Public ClickHouse HTTPS endpoint, including port.',
} as const

export const CLICKHOUSE_DATABASE_FIELD_COPY = {
  label: 'Database',
  description: 'ClickHouse database where replicated tables are created.',
} as const

export const CLICKHOUSE_ENGINE_FIELD_COPY = {
  label: 'Table engine',
  description: 'Controls how ClickHouse stores and queries replicated changes.',
} as const

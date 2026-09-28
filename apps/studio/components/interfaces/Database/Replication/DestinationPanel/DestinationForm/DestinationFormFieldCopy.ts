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
  description:
    "Pipelines connects to this project's Postgres instance to store the DuckLake catalog.",
} as const

export const DUCKLAKE_STORAGE_PROJECT_FIELD_COPY = {
  label: 'Storage project',
  description: 'The project whose object storage holds the DuckLake data files.',
} as const

export const DUCKLAKE_BUCKET_FIELD_COPY = {
  label: 'Bucket',
  description: 'The bucket in which DuckLake data files will be stored.',
} as const

export const DUCKLAKE_CATALOG_URL_FIELD_COPY = {
  label: 'Catalog URL',
  createDescription: 'A Postgres connection string for the DuckLake catalog.',
  editDescription: 'Stored catalog URL is hidden. Enter a new URL to replace it.',
} as const

export const DUCKLAKE_DATA_PATH_FIELD_COPY = {
  label: 'Data path',
  description: 'An S3 path where DuckLake data files will be written.',
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
  label: 'HTTPS URL',
  description: 'The HTTPS endpoint for your ClickHouse server, including port.',
} as const

export const CLICKHOUSE_DATABASE_FIELD_COPY = {
  label: 'Database',
  description: 'The ClickHouse database where replicated tables will be created.',
} as const

export const CLICKHOUSE_ENGINE_FIELD_COPY = {
  label: 'Table engine',
  description: 'Defaults to ReplacingMergeTree.',
} as const

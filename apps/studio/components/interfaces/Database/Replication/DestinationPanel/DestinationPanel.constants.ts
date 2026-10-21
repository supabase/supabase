import type { DestinationType } from './DestinationPanel.types'

export const DESTINATION_DOCS_PATHS: Partial<Record<DestinationType, string>> = {
  BigQuery: '/guides/database/replication/pipelines/bigquery#configure-bigquery-as-a-destination',
  ClickHouse:
    '/guides/database/replication/pipelines/clickhouse#configure-clickhouse-as-a-destination',
  DuckLake: '/guides/database/replication/pipelines/ducklake#choose-a-configuration-mode',
  Snowflake: '/guides/database/replication/pipelines/snowflake#prepare-snowflake-resources',
}

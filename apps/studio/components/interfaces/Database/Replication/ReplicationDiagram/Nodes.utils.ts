export type ReplicationDestinationType =
  | 'BigQuery'
  | 'Analytics Bucket'
  | 'DuckLake'
  | 'Snowflake'
  | 'ClickHouse'

export const getReplicationDestinationType = (
  config?: Record<string, unknown>
): ReplicationDestinationType | undefined => {
  if (!config) return undefined
  if ('big_query' in config) return 'BigQuery'
  if ('iceberg' in config) return 'Analytics Bucket'
  if ('ducklake' in config) return 'DuckLake'
  if ('snowflake' in config) return 'Snowflake'
  if ('clickhouse' in config) return 'ClickHouse'
  return undefined
}

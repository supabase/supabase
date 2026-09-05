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

/**
 * The specific place inside a destination that a pipeline writes to — a BigQuery dataset, a
 * ClickHouse or Snowflake database, an Iceberg warehouse. Returns undefined when the destination
 * has no single meaningful target (DuckLake writes to a data path).
 */
export const getReplicationDestinationTarget = (
  config?: Record<string, unknown>
): string | undefined =>
  (config?.big_query as { dataset_id?: string })?.dataset_id ??
  (config?.clickhouse as { database?: string })?.database ??
  (config?.snowflake as { database?: string })?.database ??
  (config?.iceberg as { warehouse_name?: string })?.warehouse_name

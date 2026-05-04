export type ReplicationDestinationType = 'BigQuery' | 'Analytics Bucket' | 'DuckLake'

export const getReplicationDestinationType = (
  config?: Record<string, unknown>
): ReplicationDestinationType | undefined => {
  if (!config) return undefined
  if ('big_query' in config) return 'BigQuery'
  if ('iceberg' in config) return 'Analytics Bucket'
  if ('ducklake' in config) return 'DuckLake'
  return undefined
}

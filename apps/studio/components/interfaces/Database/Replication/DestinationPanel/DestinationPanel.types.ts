export type DestinationType =
  | 'BigQuery'
  | 'Analytics Bucket'
  | 'DuckLake'
  | 'Snowflake'
  | 'ClickHouse'

export type ExistingDestination = {
  sourceId?: number
  destinationId: number
  pipelineId?: number
  enabled: boolean
  statusName?: string
}

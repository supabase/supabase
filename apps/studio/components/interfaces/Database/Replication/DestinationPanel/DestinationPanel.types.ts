export type DestinationType =
  | 'Read Replica'
  | 'BigQuery'
  | 'Analytics Bucket'
  | 'DuckLake'
  | 'Snowflake'

export type ExistingDestination = {
  sourceId?: number
  destinationId: number
  pipelineId?: number
  enabled: boolean
  statusName?: string
}

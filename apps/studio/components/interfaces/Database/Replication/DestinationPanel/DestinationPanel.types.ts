export type DestinationType =
  | 'BigQuery'
  | 'Analytics Bucket'
  | 'DuckLake'
  | 'Snowflake'
  | 'ClickHouse'

export type FlowDestination = Exclude<DestinationType, 'Analytics Bucket'>

export type ExistingDestination = {
  sourceId?: number
  destinationId: number
  pipelineId?: string
  enabled: boolean
  statusName?: string
}

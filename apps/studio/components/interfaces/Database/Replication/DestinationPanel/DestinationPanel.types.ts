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
  pipelineId?: number
  enabled: boolean
  statusName?: string
}

export type DestinationType = 'BigQuery' | 'DuckLake' | 'Snowflake' | 'ClickHouse'

export type FlowDestination = DestinationType

export type ExistingDestination = {
  sourceId?: number
  destinationId: number
  pipelineId?: number
  enabled: boolean
  statusName?: string
}

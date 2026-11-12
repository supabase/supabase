export type DestinationType = 'BigQuery' | 'DuckLake' | 'Snowflake' | 'ClickHouse'

export type ExistingDestination = {
  sourceId?: number
  destinationId: number
  pipelineId?: string
  enabled: boolean
  statusName?: string
}

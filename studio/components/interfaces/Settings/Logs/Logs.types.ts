interface Metadata {
  [key: string]: string | number | Object | Object[]
}
export type LogSearchCallback = (filters: { query: string; to?: string; from?: string; fromMicro?: number, toMicro?: number }) => void

export interface LogsEndpointParams {
  // project ref
  project: string
  // micro unix timestamp
  timestamp_start?: string
  // micro timestamp
  timestamp_end?: string
  period_start?: string
  period_end?: string
  sql: string
  rawSql: string
}

export interface LogData {
  id: string
  timestamp: number
  event_message: string
  metadata: Metadata
}

export interface LogTemplate {
  label?: string
  mode: 'custom' | 'simple'
  for?: string[]
  searchString: string
}

export interface CountData {
  count: number
}

type LFResponse<T> = {
  result: T[]
  error?: {
    message: string
  }
}

export type Count = LFResponse<CountData>

export type Logs = LFResponse<LogData>

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
  [other: string]: unknown
}

export interface LogTemplate {
  label?: string
  description?: string
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

export type QueryType = 'api' | 'database' | 'functions' | 'fn_edge'

export type Mode = 'simple' | 'custom'

export type Table = 'edge_logs' | 'postgres_logs'

export interface FilterObject {
  // severity?: string[]
  // status_code?: string[]

  // `q` for the editor query.
  q?: string
  // `s` for search query.
  s?: string
  // `te` for timestamp start value.
  te?: string
}

export type Override = {
  key: string
  value: string | string[] | undefined
}

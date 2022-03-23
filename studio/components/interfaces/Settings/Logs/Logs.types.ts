interface Metadata {
  [key: string]: string | number | Object | Object[]
}
export type LogSearchCallback = (filters: {
  query: string
  from?: string
  fromMicro?: number
}) => void
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

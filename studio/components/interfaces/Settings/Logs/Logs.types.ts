interface Metadata {
  [key: string]: string | number | Object | Object[]
}

export interface LogData {
  id: string
  timestamp: number
  event_message: string
  metadata: Metadata
}

export interface LogTemplate {
  label: string
  mode: 'custom' | 'simple'
  searchString: string
}

export interface CountData {
  count: number
}

export interface Count {
  data: [CountData] | []
  error?: any
}

export interface Logs {
  data: LogData[]
  count: number
  error: any
}

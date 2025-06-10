// Shared types for the trace viewer components

export interface Span {
  id: string
  name: string
  startTime: number
  endTime: number
  level?: number // Optional
  highlight?: boolean
  status?: 'success' | 'error' | 'warning' | 'info'
  icon?: string // Icon identifier
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' // HTTP method
}

export interface Marker {
  id: string
  name: string
  time: number
  type: 'success' | 'error' | 'warning' | 'info'
}

export interface TraceData {
  spans: Span[]
  markers?: Marker[]
  duration: number
}

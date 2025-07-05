export type FlowType = 'rest' | 'auth' | 'storage' | 'realtime' | 'functions'

export interface ServiceLogEntry {
  id: string
  timestamp: string
  service: string
  level: 'success' | 'warning' | 'error'
  status?: string
  method?: string
  path?: string
  host?: string
  duration_ms?: number
  metadata?: Record<string, any>

  // API Authentication info
  api_key_role?: 'anon' | 'service_role' | '<invalid>' | '<unrecognized>'
  api_key_prefix?: string
  api_key_error?: string

  // User Authorization info
  auth_role?: 'authenticated' | 'anon'
  user_id?: string
  user_email?: string

  // Network info (Cloudflare)
  cf_ray?: string
  cf_country?: string
  cf_datacenter?: string
  user_agent?: string
  ip_address?: string

  // Postgres specific info
  database_name?: string
  database_user?: string
  command_tag?: string
  backend_type?: string
  connection_from?: string
  session_id?: string
  process_id?: number
  query_id?: number
  transaction_id?: number
  virtual_transaction_id?: string
  session_start_time?: string
  error_severity?: string
  sql_state_code?: string
}

export interface ServiceLayer {
  layer: 'network' | 'api' | 'user' | 'postgrest' | 'postgres'
  service_name: string
  display_name: string
  logs: ServiceLogEntry[]
  status: 'success' | 'warning' | 'error'
  total_duration_ms?: number
  request_count: number
}

export interface ServiceFlowData {
  flow_type: FlowType
  request_path: string
  total_duration_ms: number
  overall_status: 'success' | 'warning' | 'error'
  layers: ServiceLayer[]
  correlation_window: {
    start: string
    end: string
  }
}

export interface ServiceFlowQueryParams {
  selectedLogId: string
  timeRange: {
    start: string
    end: string
  }
  path: string
}

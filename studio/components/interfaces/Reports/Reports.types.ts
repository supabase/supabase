export enum Presets {
  API_OVERVIEW = 'overview',
  API_BOTS = 'api_bots',
  AUTH = 'auth',
}

export interface PresetConfig {
  title: string
  sql: Record<string, string>
}
export interface StatusCodesDatum {
  timestamp: number
  status_code: number
  count: number
}
export interface PathsDatum {
  timestamp: number
  path: string
  query_params: string
  count: number
  sum: number
  method: string
  avg_origin_time: number
  quantiles: number[]
}

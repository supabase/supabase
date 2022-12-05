export enum Presets {
  API_OVERVIEW = 'overview',
  API_BOTS = 'api_bots',
  AUTH = 'auth',
}

export interface BaseReportParams {
  iso_timestamp_start: string
  iso_timestamp_end: string
}

export type VariableSql = string | ((params: BaseReportParams) => string)

export type PresetSql = string | VariableSql

export interface PresetConfig {
  title: string
  queries: Record<
    string,
    {
      sql: PresetSql
      queryType: 'logs' | 'db'
    }
  >
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

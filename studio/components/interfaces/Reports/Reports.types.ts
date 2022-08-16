export enum Presets {
  OVERVIEW = 'overview',
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
}

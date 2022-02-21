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
  method: string
  avg_origin_time: number
}

export interface EndpointResponse<T> {
  result: Array<T>
  error: Object
}

export interface StatusCodesDatum {
  timestamp: number
  status_code: number
  count: number
}

export interface EndpointResponse<T> {
  result: Array<T>
  error: Object
}

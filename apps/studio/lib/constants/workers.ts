export const PRODUCT_NAME = 'Workers'
export const CLI_NAME = 'workers'

// The three OTEL streams a worker emits, keyed by the `log_attributes['source']`
// value each one is tagged with.
export const WORKER_LOG_SOURCES = {
  requests: 'worker_ingress_logs',
  output: 'worker_guest_logs',
  builds: 'worker_api_logs',
} as const

export type WorkerLogStream = keyof typeof WORKER_LOG_SOURCES

// Display order for stream pickers and badges.
export const WORKER_LOG_STREAMS = [
  'requests',
  'output',
  'builds',
] as const satisfies readonly WorkerLogStream[]

export const WORKER_LOG_STREAM_LABEL: Record<WorkerLogStream, string> = {
  requests: 'Invocations',
  output: 'Logs',
  builds: 'Activity',
}

// Boolean view-option search params (see SEARCH_PARAMS_PARSER) that hide a stream when false.
export const WORKER_LOG_STREAM_SEARCH_PARAM = {
  requests: 'worker_requests',
  output: 'worker_output',
  builds: 'worker_builds',
} as const satisfies Record<WorkerLogStream, string>

export type WorkerLogStreamSearchParam = (typeof WORKER_LOG_STREAM_SEARCH_PARAM)[WorkerLogStream]

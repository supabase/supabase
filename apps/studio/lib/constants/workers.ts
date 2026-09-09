export const PRODUCT_NAME = 'Workers'
export const CLI_NAME = 'workers'

export const WORKER_LOG_SOURCES = {
  requests: 'worker_ingress_logs',
  output: 'worker_guest_logs',
  builds: 'worker_api_logs',
} as const

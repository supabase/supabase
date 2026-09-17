export const PRODUCT_NAME = 'Compute'
export const CLI_NAME = 'compute'

// The backend still tags these rows' `log_attributes` with the pre-rename "worker" source
// names, so these values must stay as-is until the backend renames its log sources too.
export const WORKER_LOG_SOURCES = {
  requests: 'worker_ingress_logs',
  output: 'worker_guest_logs',
  builds: 'worker_api_logs',
} as const

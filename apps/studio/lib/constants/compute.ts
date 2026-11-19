export const PRODUCT_NAME = 'Compute'
export const CLI_NAME = 'compute'

// The stream each row belongs to, as the backend publishes it. The values keep the
// pre-rename "worker" spelling until the backend renames its log streams too.
export const COMPUTE_LOG_SUBSERVICES = {
  requests: 'worker_ingress_logs',
  output: 'worker_guest_logs',
  builds: 'worker_api_logs',
} as const

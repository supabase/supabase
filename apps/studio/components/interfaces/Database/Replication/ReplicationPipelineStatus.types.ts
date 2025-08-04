export type RetryPolicy = 
  | { policy: 'no_retry' }
  | { policy: 'manual_retry' }
  | { policy: 'timed_retry'; next_retry: string }

export const isValidRetryPolicy = (policy: any): policy is RetryPolicy => {
  if (!policy || typeof policy !== 'object' || !policy.policy) return false
  
  switch (policy.policy) {
    case 'no_retry':
    case 'manual_retry':
      return true
    case 'timed_retry':
      return typeof policy.next_retry === 'string'
    default:
      return false
  }
}

export type TableState = {
  table_id: number
  table_name: string
  state:
    | { name: 'queued' }
    | { name: 'copying_table' }
    | { name: 'copied_table' }
    | { name: 'following_wal'; lag: number }
    | { name: 'error'; reason: string; solution?: string; retry_policy: RetryPolicy }
}

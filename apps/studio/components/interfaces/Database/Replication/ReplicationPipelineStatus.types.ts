export type RetryPolicy =
  | { policy: 'no_retry' }
  | { policy: 'manual_retry' }
  | { policy: 'timed_retry'; next_retry: string }

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

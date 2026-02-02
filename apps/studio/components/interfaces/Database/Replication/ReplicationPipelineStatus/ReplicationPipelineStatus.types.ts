export type RetryPolicy =
  | { policy: 'no_retry' }
  | { policy: 'manual_retry' }
  | { policy: 'timed_retry'; next_retry: string }

export type SlotLagMetrics = {
  restart_lsn_bytes: number
  confirmed_flush_lsn_bytes: number
  safe_wal_size_bytes: number
  write_lag?: number
  flush_lag?: number
}

export type SlotLagMetricKey = keyof SlotLagMetrics

export type TableState = {
  table_id: number
  table_name: string
  state:
    | { name: 'queued' }
    | { name: 'copying_table' }
    | { name: 'copied_table' }
    | { name: 'following_wal'; lag: number }
    | { name: 'error'; reason: string; solution?: string; retry_policy: RetryPolicy }
  table_sync_lag?: SlotLagMetrics
}

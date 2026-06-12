export type RetryPolicy =
  | { policy: 'no_retry' }
  | { policy: 'manual_retry' }
  | { policy: 'timed_retry'; next_retry: string }

// WAL availability status reported by Postgres for the replication slot. Unrecognized future
// values from Postgres are surfaced as 'unknown'; the field is absent when not reported.
export type SlotWalStatus = 'reserved' | 'extended' | 'unreserved' | 'lost' | 'unknown'

export type SlotLagMetrics = {
  active: boolean
  wal_status?: SlotWalStatus
  restart_lsn_bytes: number
  confirmed_flush_lsn_bytes: number
  // null means Postgres reports unlimited slot WAL retention.
  safe_wal_size_bytes: number | null
  write_lag?: number
  flush_lag?: number
  // Milliseconds since the destination last sent feedback. Present even when write/flush lag are not.
  reply_time_lag?: number
}

// Numeric metrics rendered as value tiles (kept separate from the non-numeric slot fields above).
export type SlotLagMetricKey =
  | 'confirmed_flush_lsn_bytes'
  | 'safe_wal_size_bytes'
  | 'flush_lag'
  | 'reply_time_lag'

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

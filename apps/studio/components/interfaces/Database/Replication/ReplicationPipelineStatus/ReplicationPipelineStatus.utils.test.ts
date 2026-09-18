import { describe, expect, test } from 'vitest'

import { getTableSyncLagLabel } from './ReplicationPipelineStatus.utils'

describe('getTableSyncLagLabel', () => {
  test('omits healthy slot details when the table has caught up', () => {
    expect(
      getTableSyncLagLabel({
        active: true,
        wal_status: 'reserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
        safe_wal_size_bytes: null,
      })
    ).toEqual([])
  })

  test('reports the backlog and last check-in', () => {
    expect(
      getTableSyncLagLabel({
        active: true,
        wal_status: 'reserved',
        restart_lsn_bytes: 4096,
        confirmed_flush_lsn_bytes: 2048,
        safe_wal_size_bytes: null,
        reply_time_lag: 4800,
      })
    ).toEqual(['2 KB waiting to sync', 'Last check-in 4.80 s'])
  })

  test('reports slot risk without treating the expected inactive connection as a fault', () => {
    expect(
      getTableSyncLagLabel({
        active: false,
        wal_status: 'unreserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
        safe_wal_size_bytes: null,
      })
    ).toEqual(['Some changes at risk'])
  })
})

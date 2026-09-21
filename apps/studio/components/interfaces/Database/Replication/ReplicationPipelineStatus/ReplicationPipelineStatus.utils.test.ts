import { describe, expect, test } from 'vitest'

import { getTableSyncLagLabel } from './ReplicationPipelineStatus.utils'

describe('getTableSyncLagLabel', () => {
  test('reports unlimited WAL retention for a healthy caught-up table slot', () => {
    expect(
      getTableSyncLagLabel({
        active: true,
        wal_status: 'reserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
        safe_wal_size_bytes: null,
      })
    ).toEqual(['Unlimited WAL retention'])
  })

  test('reports the backlog, finite WAL retention, and last check-in', () => {
    expect(
      getTableSyncLagLabel({
        active: true,
        wal_status: 'reserved',
        restart_lsn_bytes: 4096,
        confirmed_flush_lsn_bytes: 2048,
        safe_wal_size_bytes: 1_363_148_800,
        reply_time_lag: 4800,
      })
    ).toEqual(['2 KB waiting to sync', '1.3 GB WAL retention remaining', 'Last check-in 4.80 s'])
  })

  test('reports slot risk without treating the expected inactive connection as a fault', () => {
    expect(
      getTableSyncLagLabel({
        active: false,
        wal_status: 'unreserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
        safe_wal_size_bytes: 0,
      })
    ).toEqual(['0 bytes WAL retention remaining', 'Some changes at risk'])
  })

  test('omits WAL retention when the API does not provide it', () => {
    expect(
      getTableSyncLagLabel({
        active: true,
        wal_status: 'reserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
      })
    ).toEqual([])
  })

  test('omits an invalid WAL retention value', () => {
    expect(
      getTableSyncLagLabel({
        active: true,
        wal_status: 'reserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
        safe_wal_size_bytes: Number.NaN,
      })
    ).toEqual([])
  })

  test('omits a negative WAL retention value', () => {
    expect(
      getTableSyncLagLabel({
        active: true,
        wal_status: 'reserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
        safe_wal_size_bytes: -1,
      })
    ).toEqual([])
  })
})

import { describe, expect, test } from 'vitest'

import {
  getFormattedLagValue,
  getSlotBudgetSeverity,
  getSlotHealthSeverity,
  getTableSyncLagLabel,
} from './ReplicationPipelineStatus.utils'
import { getFieldDisplay, SLOT_LAG_FIELDS } from './SlotLagMetrics'

describe('lag availability', () => {
  test.each([null, undefined, Number.NaN, Number.POSITIVE_INFINITY])(
    'formats unavailable measurements (%s) without reporting zero',
    (value) => {
      expect(getFormattedLagValue('bytes', value).display).toBe('Unavailable')
      expect(getFormattedLagValue('duration', value).display).toBe('Unavailable')
    }
  )

  test('distinguishes caught-up lag, unavailable lag, and exhausted retention', () => {
    const lag = SLOT_LAG_FIELDS.find((field) => field.key === 'confirmed_flush_lsn_bytes')!
    const headroom = SLOT_LAG_FIELDS.find((field) => field.key === 'safe_wal_size_bytes')!

    expect(getFieldDisplay(lag, 0).display).toBe('Caught up')
    expect(getFieldDisplay(lag, null).display).toBe('Unavailable')
    expect(getFieldDisplay(headroom, null).display).toBe('Unavailable')
    expect(getFieldDisplay(headroom, -1024).display).toBe('Budget exceeded')
  })
})

describe('slot health', () => {
  test.each([
    [null, null, 'normal'],
    [null, 0, 'critical'],
    [0, -1024, 'critical'],
    [100, 100, 'normal'],
    [75, 25, 'warning'],
    [90, 10, 'critical'],
  ] as const)('classifies retained %s and headroom %s as %s', (retained, headroom, severity) => {
    expect(getSlotBudgetSeverity(retained, headroom)).toBe(severity)
  })

  test('preserves lost-slot severity when distances are unavailable', () => {
    expect(
      getSlotHealthSeverity({
        wal_status: 'lost',
        restart_lsn_bytes: null,
        safe_wal_size_bytes: null,
      })
    ).toBe('critical')
  })
})

describe('getTableSyncLagLabel', () => {
  test('does not infer unlimited retention from missing headroom', () => {
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

  test('reports unavailable lag without hiding a lost slot', () => {
    expect(
      getTableSyncLagLabel({
        active: false,
        wal_status: 'lost',
        restart_lsn_bytes: null,
        confirmed_flush_lsn_bytes: null,
        safe_wal_size_bytes: null,
      })
    ).toEqual(['Lag unavailable', 'Some changes lost'])
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
    ).toEqual(['2 KB WAL backlog', '1.3 GB WAL retention remaining', 'Last check-in 4.80 s'])
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

  test('reports an exceeded WAL retention budget', () => {
    expect(
      getTableSyncLagLabel({
        active: true,
        wal_status: 'reserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
        safe_wal_size_bytes: -1,
      })
    ).toEqual(['WAL retention budget exceeded'])
  })
})

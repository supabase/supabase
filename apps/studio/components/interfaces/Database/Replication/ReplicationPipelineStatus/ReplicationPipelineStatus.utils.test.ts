import { describe, expect, test } from 'vitest'

import {
  getInitialSyncProgress,
  getInitialSyncSummary,
  getPipelineStateNotice,
  getTableStatusEmptyState,
  getTableSyncLagLabel,
} from './ReplicationPipelineStatus.utils'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'

const DISABLED_CONFIG = { title: 'Starting pipeline', message: 'This can take a moment.' }

describe('getTableStatusEmptyState', () => {
  test('prefers the disabled state config while the pipeline is transitioning', () => {
    expect(
      getTableStatusEmptyState({
        isDisabled: true,
        disabledStateConfig: DISABLED_CONFIG,
        statusName: 'stopped',
      })
    ).toEqual({ title: 'Starting pipeline', description: 'This can take a moment.' })
  })

  test('explains how to recover a stopped pipeline', () => {
    expect(
      getTableStatusEmptyState({
        isDisabled: false,
        disabledStateConfig: DISABLED_CONFIG,
        statusName: 'stopped',
      }).title
    ).toBe('Pipeline stopped')
  })

  test('explains how to recover a failed pipeline', () => {
    expect(
      getTableStatusEmptyState({
        isDisabled: false,
        disabledStateConfig: DISABLED_CONFIG,
        statusName: 'failed',
      }).title
    ).toBe('Pipeline failed')
  })

  test('falls back to a neutral message for a running pipeline with no tables yet', () => {
    expect(
      getTableStatusEmptyState({
        isDisabled: false,
        disabledStateConfig: DISABLED_CONFIG,
        statusName: 'started',
      })
    ).toEqual({
      title: 'No table data yet',
      description: 'Table status appears here once replication begins',
    })
  })
})

const liveTables = (count: number) =>
  Array.from({ length: count }, () => ({ state: { name: 'following_wal' as const } }))

describe('getPipelineStateNotice', () => {
  test('says nothing about a healthy running pipeline', () => {
    expect(
      getPipelineStateNotice({
        requestStatus: PipelineStatusRequestStatus.None,
        statusName: 'started',
        tableStatuses: liveTables(3),
      })
    ).toBeUndefined()
  })

  test('points a failed pipeline at its logs', () => {
    const notice = getPipelineStateNotice({
      requestStatus: PipelineStatusRequestStatus.None,
      statusName: 'failed',
      tableStatuses: liveTables(3),
    })

    expect(notice?.type).toBe('destructive')
    expect(notice?.showLogsLink).toBe(true)
  })

  test('explains a stopped pipeline without offering the logs', () => {
    const notice = getPipelineStateNotice({
      requestStatus: PipelineStatusRequestStatus.None,
      statusName: 'stopped',
      tableStatuses: liveTables(3),
    })

    expect(notice?.title).toBe('Pipeline stopped')
    expect(notice?.showLogsLink).toBe(false)
  })

  test('reports a transition in progress ahead of the reported status', () => {
    const notice = getPipelineStateNotice({
      requestStatus: PipelineStatusRequestStatus.StartRequested,
      statusName: 'stopped',
      tableStatuses: liveTables(3),
    })

    expect(notice?.title).toBe('Starting pipeline')
  })

  test('describes an initial sync without calling queued tables copying', () => {
    const notice = getPipelineStateNotice({
      requestStatus: PipelineStatusRequestStatus.None,
      statusName: 'started',
      tableStatuses: [
        ...liveTables(2),
        { state: { name: 'copying_table' as const } },
        { state: { name: 'queued' as const } },
      ],
    })

    expect(notice?.title).toBe('Initial sync is running')
    expect(notice?.description).toContain('1 of 4 tables is copying and 1 is waiting.')
  })
})

describe('getTableSyncLagLabel', () => {
  test('says nothing when a healthy slot has caught up', () => {
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

  test('reports the backlog and the last check-in', () => {
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

  test('says what an at-risk slot means, and skips the expected inactive connection', () => {
    // A copying table's slot is inactive by design, so that is not worth flagging per row
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

describe('getInitialSyncProgress', () => {
  test('counts queued, copying and copied tables as still syncing, and splits the first two', () => {
    expect(
      getInitialSyncProgress([
        { state: { name: 'following_wal' } },
        { state: { name: 'queued' } },
        { state: { name: 'copying_table' } },
        { state: { name: 'copied_table' } },
      ])
    ).toEqual({ syncingCount: 3, copyingCount: 1, queuedCount: 1, totalCount: 4 })
  })

  test('reports nothing syncing once every table is streaming', () => {
    expect(getInitialSyncProgress(liveTables(3))).toEqual({
      syncingCount: 0,
      copyingCount: 0,
      queuedCount: 0,
      totalCount: 3,
    })
  })

  test('does not count an errored table as still syncing', () => {
    expect(getInitialSyncProgress([...liveTables(1), { state: { name: 'error' } }])).toEqual({
      syncingCount: 0,
      copyingCount: 0,
      queuedCount: 0,
      totalCount: 2,
    })
  })
})

describe('getInitialSyncSummary', () => {
  const summarise = (copyingCount: number, queuedCount: number, totalCount: number) =>
    getInitialSyncSummary({
      syncingCount: copyingCount + queuedCount,
      copyingCount,
      queuedCount,
      totalCount,
    })

  test('separates copying from waiting', () => {
    expect(summarise(4, 3, 8)).toBe('4 of 8 tables are copying and 3 are waiting.')
  })

  test('uses singular verbs when only one table is copying or waiting', () => {
    expect(summarise(1, 1, 4)).toBe('1 of 4 tables is copying and 1 is waiting.')
  })

  test('drops the waiting clause when nothing is queued', () => {
    expect(summarise(2, 0, 8)).toBe('2 of 8 tables are copying.')
  })

  test('handles the moment before any worker has picked a table up', () => {
    expect(summarise(0, 3, 3)).toBe('3 tables are waiting to copy.')
  })

  test('handles a single table grammatically', () => {
    expect(summarise(1, 0, 1)).toBe('1 of 1 table is copying.')
  })

  test('covers tables that have copied but not started streaming yet', () => {
    expect(summarise(0, 0, 2)).toBe('The last tables are finishing their copy.')
  })
})

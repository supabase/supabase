import { describe, expect, test } from 'vitest'

import {
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
      description: 'Table status appears here once replication begins.',
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

  test('counts the tables still copying during an initial sync', () => {
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
    expect(notice?.description).toContain('2 of 4 tables')
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

  test('surfaces a disconnected slot and an at-risk WAL status', () => {
    expect(
      getTableSyncLagLabel({
        active: false,
        wal_status: 'unreserved',
        restart_lsn_bytes: 0,
        confirmed_flush_lsn_bytes: 0,
        safe_wal_size_bytes: null,
      })
    ).toEqual(['Not connected', 'WAL unreserved'])
  })
})

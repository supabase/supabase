import { describe, expect, test } from 'vitest'

import {
  getInitialSyncSummary,
  getPipelineStateNotice,
  getTableStatusEmptyState,
} from './PipelineOverview.utils'
import { PipelineStatusRequestStatus } from '@/state/replication-pipeline-request-status'

const disabledStateConfig = { title: 'Starting pipeline', message: 'This can take a moment.' }
const liveTables = (count: number) =>
  Array.from({ length: count }, () => ({ state: { name: 'following_wal' as const } }))

describe('getTableStatusEmptyState', () => {
  test.each([
    [true, 'stopped' as const, 'Starting pipeline'],
    [false, 'stopped' as const, 'Pipeline stopped'],
    [false, 'failed' as const, 'Pipeline failed'],
    [false, 'started' as const, 'No table data yet'],
  ])('returns the appropriate empty state', (isDisabled, statusName, title) => {
    expect(getTableStatusEmptyState({ isDisabled, disabledStateConfig, statusName }).title).toBe(
      title
    )
  })
})

describe('getPipelineStateNotice', () => {
  test('omits a notice for a healthy running pipeline', () => {
    expect(
      getPipelineStateNotice({
        requestStatus: PipelineStatusRequestStatus.None,
        statusName: 'started',
        tableStatuses: liveTables(3),
      })
    ).toBeUndefined()
  })

  test.each([
    ['failed' as const, 'destructive', true],
    ['stopped' as const, 'note', false],
  ])('explains a %s pipeline', (statusName, type, showLogsLink) => {
    expect(
      getPipelineStateNotice({
        requestStatus: PipelineStatusRequestStatus.None,
        statusName,
        tableStatuses: liveTables(3),
      })
    ).toMatchObject({ type, showLogsLink })
  })

  test('reports a requested transition ahead of the API status', () => {
    expect(
      getPipelineStateNotice({
        requestStatus: PipelineStatusRequestStatus.StartRequested,
        statusName: 'stopped',
        tableStatuses: liveTables(3),
      })?.title
    ).toBe('Starting pipeline')
  })

  test('distinguishes copying tables from queued tables', () => {
    expect(
      getPipelineStateNotice({
        requestStatus: PipelineStatusRequestStatus.None,
        statusName: 'started',
        tableStatuses: [
          ...liveTables(2),
          { state: { name: 'copying_table' as const } },
          { state: { name: 'queued' as const } },
        ],
      })?.description
    ).toContain('1 of 4 tables is copying and 1 is waiting.')
  })
})

describe('getInitialSyncSummary', () => {
  test.each([
    [4, 3, 8, '4 of 8 tables are copying and 3 are waiting.'],
    [1, 1, 4, '1 of 4 tables is copying and 1 is waiting.'],
    [2, 0, 8, '2 of 8 tables are copying.'],
    [0, 3, 3, '3 tables are waiting to copy.'],
    [1, 0, 1, '1 of 1 table is copying.'],
    [0, 0, 2, 'The last tables are finishing their copy.'],
  ])('summarises initial sync progress', (copyingCount, queuedCount, totalCount, expected) => {
    expect(
      getInitialSyncSummary({
        syncingCount: copyingCount + queuedCount,
        copyingCount,
        queuedCount,
        totalCount,
      })
    ).toBe(expected)
  })
})

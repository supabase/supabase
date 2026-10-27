import { afterEach, describe, expect, it, vi } from 'vitest'

import { getUnifiedLogs } from './unified-logs-infinite-query'
import { compareRows, createRow, mockLogs, now, search } from './unified-logs.test-utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('getUnifiedLogs forward pagination', () => {
  it.each([false, true])('paginates equal microsecond timestamps with otel=%s', async (useOtel) => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const timestamp = (now.getTime() - 1000) * 1000 + 123
    const rows = Array.from({ length: 120 }, (_, index) =>
      createRow(`log-${String(index).padStart(3, '0')}`, timestamp)
    )
    const requests = mockLogs(rows, useOtel)
    const variables = { projectRef: 'default', search, useOtel }
    const first = await getUnifiedLogs({ ...variables, pageParam: null })
    const second = await getUnifiedLogs({
      ...variables,
      pageParam: { cursor: first.nextCursor!, row: first.nextRow!, direction: 'next' },
    })
    const third = await getUnifiedLogs({
      ...variables,
      pageParam: { cursor: second.nextCursor!, row: second.nextRow!, direction: 'next' },
    })

    expect([first.data.length, second.data.length, third.data.length]).toEqual([50, 50, 20])
    expect([...first.data, ...second.data, ...third.data].map((row) => row.id)).toEqual(
      [...rows].sort(compareRows).map((row) => row.id)
    )
    expect(third.nextCursor).toBeNull()
    expect(requests[1].sql).toContain(String(timestamp))
    expect(requests[1].sql).not.toContain('OFFSET')
  })

  it('preserves nanosecond ISO cursors on OTEL', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const rows = Array.from({ length: 51 }, (_, index) =>
      createRow(
        `log-${String(index).padStart(3, '0')}`,
        `2026-09-30T11:59:59.000000${String(index).padStart(3, '0')}`
      )
    )
    const requests = mockLogs(rows, true)
    const variables = { projectRef: 'default', search, useOtel: true }
    const first = await getUnifiedLogs({ ...variables, pageParam: null })
    const second = await getUnifiedLogs({
      ...variables,
      pageParam: { cursor: first.nextCursor!, row: first.nextRow!, direction: 'next' },
    })
    expect([...first.data, ...second.data].map((row) => row.id)).toEqual(
      [...rows].sort(compareRows).map((row) => row.id)
    )
    expect(requests[1].sql).toContain(
      "parseDateTime64BestEffort('2026-09-30T11:59:59.000000001', 9, 'UTC')"
    )
  })
})

describe('getUnifiedLogs page size', () => {
  it('fetches only the requested number of rows per page', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const rows = Array.from({ length: 20 }, (_, index) =>
      createRow(`log-${String(index).padStart(3, '0')}`, (now.getTime() - 1000 - index) * 1000)
    )
    const requests = mockLogs(rows, true)

    const page = await getUnifiedLogs({
      projectRef: 'default',
      search,
      useOtel: true,
      pageSize: 5,
      pageParam: null,
    })

    expect(requests[0].sql).toMatch(/LIMIT 5$/)
    expect(page.data).toHaveLength(5)
    expect(page.nextCursor).not.toBeNull()
  })
})

describe('getUnifiedLogs final page', () => {
  it.each([
    { pageSize: 5, rowCount: 4 },
    { pageSize: 1, rowCount: 0 },
  ])(
    'stops loading more logs when the final $pageSize-row page contains $rowCount rows',
    async ({ pageSize, rowCount }) => {
      vi.useFakeTimers()
      vi.setSystemTime(now)
      const rows = Array.from({ length: rowCount }, (_, index) =>
        createRow(`log-${index}`, (now.getTime() - 1000 - index) * 1000)
      )
      mockLogs(rows, true)

      const page = await getUnifiedLogs({
        projectRef: 'default',
        search,
        useOtel: true,
        pageSize,
        pageParam: { cursor: now.getTime(), direction: 'next' },
      })

      expect(page.data).toHaveLength(rowCount)
      expect(page.nextCursor).toBeNull()
    }
  )
})

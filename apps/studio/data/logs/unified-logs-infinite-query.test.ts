import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import * as common from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getUnifiedLogs, useUnifiedLogsInfiniteQuery } from './unified-logs-infinite-query'
import {
  compareRows,
  createRow,
  mockLogs as mockBackendLogs,
  now,
  search,
} from './unified-logs.test-utils'
import { deduplicateUnifiedLogs } from './unified-logs.utils'
import { customRenderHook } from '@/tests/lib/custom-render'

const mockLogs = (rows: ReturnType<typeof createRow>[]) => mockBackendLogs(rows, true)

beforeEach(() => {
  vi.spyOn(common, 'useFeatureFlags').mockReturnValue({
    configcat: { otelUnifiedLogs: true },
    posthog: {},
    hasLoaded: true,
  })
})

const getLiveLogs = (cursor: number) =>
  getUnifiedLogs({
    projectRef: 'default',
    search,
    useOtel: true,
    pageParam: { cursor, direction: 'prev' },
  })

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('getUnifiedLogs live polling', () => {
  it('uses the previous poll time minus the overlap for successive polls', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const requests = mockLogs([])

    const firstPoll = await getLiveLogs(now.getTime())
    vi.setSystemTime(new Date('2026-09-30T12:00:10.000Z'))
    const secondPoll = await getLiveLogs(firstPoll.prevCursor)
    vi.setSystemTime(new Date('2026-09-30T12:00:20.000Z'))
    await getLiveLogs(secondPoll.prevCursor)

    expect(
      requests.map(({ iso_timestamp_start, iso_timestamp_end }) => ({
        iso_timestamp_start,
        iso_timestamp_end,
      }))
    ).toEqual([
      {
        iso_timestamp_start: '2026-09-30T11:58:00.000Z',
        iso_timestamp_end: '2026-09-30T12:00:00.000Z',
      },
      {
        iso_timestamp_start: '2026-09-30T11:58:00.000Z',
        iso_timestamp_end: '2026-09-30T12:00:10.000Z',
      },
      {
        iso_timestamp_start: '2026-09-30T11:58:10.000Z',
        iso_timestamp_end: '2026-09-30T12:00:20.000Z',
      },
    ])
  })

  it('drains equal-timestamp bursts across query pages', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const rows = Array.from({ length: 51 }, (_, index) => createRow(`log-${index}`))
    const requests = mockLogs(rows)

    const response = await getLiveLogs(now.getTime())

    expect(response.data.map((row) => row.id)).toEqual(
      [...rows].sort(compareRows).map((row) => row.id)
    )
    expect(requests).toHaveLength(2)
    expect(requests[1].sql).toContain('fromUnixTimestamp64Micro(')
    expect(requests[1].sql).not.toContain('OFFSET')
  })

  it('includes records that arrive within the overlap', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-30T12:01:00.000Z'))
    mockLogs([
      createRow('late-log', new Date('2026-09-30T11:59:30.000Z').getTime() * 1000),
      createRow('expired-log', new Date('2026-09-30T11:57:59.999Z').getTime() * 1000),
    ])

    const response = await getLiveLogs(now.getTime())

    expect(response.data.map((row) => row.id)).toEqual(['late-log'])
  })

  it('keeps explicit date ranges unchanged', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-30T12:01:00.000Z'))
    const requests = mockLogs([])
    const start = new Date('2026-09-30T11:00:00.000Z')
    const end = new Date('2026-09-30T11:30:00.000Z')

    await getUnifiedLogs({
      projectRef: 'default',
      search: { ...search, date: [start, end] },
      useOtel: true,
      pageParam: { cursor: now.getTime(), direction: 'prev' },
    })

    expect(requests[0]).toMatchObject({
      iso_timestamp_start: start.toISOString(),
      iso_timestamp_end: end.toISOString(),
    })
  })

  it('returns a poll watermark when no records are found', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    mockLogs([])

    const response = await getLiveLogs(now.getTime())

    expect(response).toMatchObject({ data: [], nextCursor: null, prevCursor: now.getTime() })
  })

  it('removes overlap duplicates before rendering rows', () => {
    expect(deduplicateUnifiedLogs([{ id: 'a' }, { id: 'b' }, { id: 'a' }])).toEqual([
      { id: 'a' },
      { id: 'b' },
    ])
  })

  it('refreshes the default range after an empty Live poll and retains older pagination', async () => {
    const timestamp = Date.now() - 10 * 60 * 1000
    const rows = Array.from({ length: 60 }, (_, index) =>
      createRow(`log-${index}`, (timestamp - index * 1000) * 1000)
    )
    const requests = mockLogs(rows)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = customRenderHook(
      () => useUnifiedLogsInfiniteQuery({ projectRef: 'default', search }),
      { queryClient }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages[0].data).toHaveLength(50)
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      const response = await result.current.fetchNextPage()
      expect(response.error).toBeNull()
    })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    const idsBeforeLive = deduplicateUnifiedLogs(
      result.current.data?.pages.flatMap((page) => page.data) ?? []
    ).map((row) => row.id)
    await act(async () => {
      await result.current.fetchPreviousPage()
    })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(3))
    expect(result.current.data?.pages[0].data).toEqual([])
    expect(result.current.hasNextPage).toBe(false)

    await act(async () => {
      await result.current.refetch()
    })
    await waitFor(() => expect(result.current.data?.pages[0].data).toHaveLength(50))

    expect(
      deduplicateUnifiedLogs(result.current.data?.pages.flatMap((page) => page.data) ?? []).map(
        (row) => row.id
      )
    ).toEqual(idsBeforeLive)
    expect(
      Date.parse(requests[3].iso_timestamp_end) - Date.parse(requests[3].iso_timestamp_start)
    ).toBe(60 * 60 * 1000)
  })

  it('handles arrivals between pages', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const timestamp = (now.getTime() - 1000) * 1000 + 123
    const rows = Array.from({ length: 120 }, (_, index) =>
      createRow(`log-${String(index).padStart(3, '0')}`, timestamp)
    )
    const originalIds = rows.map((row) => row.id)
    const requests = mockBackendLogs(rows, true, (requestNumber) => {
      if (requestNumber === 2) {
        vi.setSystemTime(new Date('2026-09-30T12:00:10.000Z'))
        rows.push(createRow('zzz-late', timestamp), createRow('aaa-late', timestamp))
      }
    })
    const variables = {
      projectRef: 'default',
      search,
      pageParam: { cursor: now.getTime(), direction: 'prev' as const },
      useOtel: true,
    }
    const firstPoll = await getUnifiedLogs(variables)
    expect(new Set(firstPoll.data.map((row) => row.id))).toEqual(
      new Set([...originalIds, 'aaa-late'])
    )
    expect(requests[1].sql).toContain(String(timestamp))
    expect(
      requests
        .slice(0, 3)
        .map(({ iso_timestamp_start, iso_timestamp_end }) => [
          iso_timestamp_start,
          iso_timestamp_end,
        ])
    ).toEqual(Array(3).fill(['2026-09-30T11:58:00.000Z', '2026-09-30T12:00:00.000Z']))
    const nextPoll = await getUnifiedLogs({
      ...variables,
      pageParam: { cursor: firstPoll.prevCursor, direction: 'prev' },
    })
    const displayed = deduplicateUnifiedLogs([...nextPoll.data, ...firstPoll.data])
    expect(displayed).toHaveLength(122)
    expect(new Set(displayed.map((row) => row.id))).toEqual(
      new Set([...originalIds, 'aaa-late', 'zzz-late'])
    )
  })

  it.each([false, true])(
    'retains Live bursts across refreshes with overlap=%s',
    async (hasOverlap) => {
      const timestamp = Date.now() - (hasOverlap ? 30 * 1000 : 10 * 60 * 1000)
      const rows = Array.from({ length: 110 }, (_, index) =>
        createRow(`old-${String(index).padStart(3, '0')}`, (timestamp - index * 1000) * 1000 + 123)
      )
      mockLogs(rows)
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { result } = customRenderHook(
        () => useUnifiedLogsInfiniteQuery({ projectRef: 'default', search }),
        { queryClient }
      )
      const displayedIds = () =>
        deduplicateUnifiedLogs(result.current.data?.pages.flatMap((page) => page.data) ?? []).map(
          (row) => row.id
        )
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(displayedIds()).toHaveLength(50)
      await act(async () => {
        const response = await result.current.fetchNextPage()
        expect(response.error).toBeNull()
      })
      await waitFor(() => expect(displayedIds()).toHaveLength(100))
      const olderIds = displayedIds()

      const liveTimestamp = Date.now() - 1000
      const burst = Array.from({ length: 120 }, (_, index) => {
        const timestamp = new Date(liveTimestamp).toISOString().replace('Z', '000123Z')
        return createRow(`live-${String(index).padStart(3, '0')}`, timestamp)
      })
      rows.push(...burst)
      await act(async () => {
        await result.current.fetchPreviousPage()
      })
      await waitFor(() => expect(displayedIds()).toHaveLength(220))
      expect(result.current.data?.pages[0].data.length).toBeGreaterThanOrEqual(120)
      await act(async () => {
        await result.current.fetchPreviousPage()
      })
      await waitFor(() => expect(result.current.data?.pages).toHaveLength(4))
      expect(displayedIds()).toHaveLength(220)
      expect(result.current.hasNextPage).toBe(true)

      const arrivals = Array.from({ length: 60 }, (_, index) =>
        createRow(`new-${String(index).padStart(3, '0')}`, burst[0].timestamp)
      )
      rows.push(...arrivals)
      const expectedIds = [...arrivals, ...burst].sort(compareRows).map((row) => row.id)
      expectedIds.push(...olderIds)
      for (let refresh = 0; refresh < 2; refresh++) {
        await act(async () => {
          const response = await result.current.refetch()
          expect(response.error).toBeNull()
        })
        await waitFor(() => expect(displayedIds()).toEqual(expectedIds))
        expect(result.current.hasNextPage).toBe(true)
      }

      await act(async () => {
        await result.current.fetchNextPage()
      })
      await waitFor(() => expect(displayedIds()).toHaveLength(290))
      expect(new Set(displayedIds())).toEqual(new Set(rows.map((row) => row.id)))
    }
  )

  it('allows older pagination immediately after an empty Live poll', async () => {
    const timestamp = Date.now() - 10 * 60 * 1000
    const rows = Array.from({ length: 110 }, (_, index) =>
      createRow(`old-${String(index).padStart(3, '0')}`, (timestamp - index * 1000) * 1000)
    )
    mockLogs(rows)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = customRenderHook(
      () => useUnifiedLogsInfiniteQuery({ projectRef: 'default', search }),
      { queryClient }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages[0].data).toHaveLength(50)

    await act(async () => {
      await result.current.fetchPreviousPage()
    })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    expect(result.current.data?.pages[0].data).toEqual([])
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      await result.current.fetchNextPage()
    })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(3))
    expect(
      deduplicateUnifiedLogs(result.current.data?.pages.flatMap((page) => page.data) ?? [])
    ).toHaveLength(100)
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
    const requests = mockLogs(rows)
    const response = await getUnifiedLogs({
      projectRef: 'default',
      search,
      useOtel: true,
      pageParam: { cursor: now.getTime(), direction: 'prev' },
    })
    expect(response.data.map((row) => row.id)).toEqual(
      [...rows].sort(compareRows).map((row) => row.id)
    )
    expect(requests[1].sql).toContain(
      "parseDateTime64BestEffort('2026-09-30T11:59:59.000000001', 9, 'UTC')"
    )
  })
})

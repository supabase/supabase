import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { retrieveUnifiedLogs } from './get-unified-logs'
import { getUnifiedLogsChart } from './unified-logs-chart-query'
import { getUnifiedLogsCount } from './unified-logs-count-query'
import { getUnifiedLogsFacetCount } from './unified-logs-facet-count-query'
import {
  getUnifiedLogs,
  getUnifiedLogsISOStartEnd,
  useUnifiedLogsInfiniteQuery,
} from './unified-logs-infinite-query'
import { useUnifiedLogsLiveQuery } from './unified-logs-live-query'
import { filterUnifiedLogsWindow } from './unified-logs-time-range'
import { createRow, mockLogs, now, search } from './unified-logs.test-utils'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { customRenderHook } from '@/tests/lib/custom-render'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
})
afterEach(() => vi.useRealTimers())
const selectedSearch = { ...search, durationSeconds: 10 }

describe('selected live time range', () => {
  it('rejects unusable URL durations while preserving millisecond and fractional ranges', () => {
    for (const value of ['0', '-1', 'NaN', 'Infinity', '1e300', '0.0001', '7776001']) {
      expect(SEARCH_PARAMS_PARSER.durationSeconds.parse(value)).toBeNull()
    }
    expect(SEARCH_PARAMS_PARSER.durationSeconds.parse('0.001')).toBe(0.001)
    expect(SEARCH_PARAMS_PARSER.durationSeconds.parse('10.025')).toBe(10.025)
    expect(
      getUnifiedLogsISOStartEnd({
        ...selectedSearch,
        date: [new Date('2026-09-30T11:00:00Z'), now],
      }).isoTimestampStart
    ).toBe('2026-09-30T11:00:00.000Z')
  })

  it('uses the same selected bounds for history, counts, facets, and chart requests', async () => {
    const requests = mockLogs([], true)
    const variables = {
      projectRef: 'default',
      search: { ...selectedSearch, durationSeconds: 10.025 },
      useOtel: true,
    }
    await Promise.all([
      getUnifiedLogs({ ...variables, pageParam: null }),
      getUnifiedLogsCount(variables),
      getUnifiedLogsFacetCount({ ...variables, facet: 'method' }),
      getUnifiedLogsChart(variables),
    ])
    expect(requests).toHaveLength(4)
    expect(
      requests.map(({ iso_timestamp_start, iso_timestamp_end }) => [
        iso_timestamp_start,
        iso_timestamp_end,
      ])
    ).toEqual(Array(4).fill(['2026-09-30T11:59:49.975Z', now.toISOString()]))
  })

  it('honors explicit export hours while fixed dates still take precedence', async () => {
    const requests = mockLogs([], true)
    const variables = { projectRef: 'default', search: selectedSearch, limit: 100, useOtel: true }
    for (const hoursAgo of [1, 12, 24]) await retrieveUnifiedLogs({ ...variables, hoursAgo })
    await retrieveUnifiedLogs({
      ...variables,
      hoursAgo: 24,
      search: { ...selectedSearch, date: [new Date(now.getTime() - 10_000), now] },
    })
    expect(requests.map(({ iso_timestamp_start }) => iso_timestamp_start)).toEqual([
      '2026-09-30T11:00:00.000Z',
      '2026-09-30T00:00:00.000Z',
      '2026-09-29T12:00:00.000Z',
      '2026-09-30T11:59:50.000Z',
    ])
  })

  it('keeps older pagination frozen and refreshes the latest duration after old boundaries expire', async () => {
    const rows = Array.from({ length: 110 }, (_, index) =>
      createRow(`old-${index}`, (now.getTime() - 1 - index * 80) * 1000)
    )
    let rerender = () => {}
    const requests = mockLogs(rows, true, () => rerender())
    const rendered = customRenderHook(
      () => useUnifiedLogsInfiniteQuery({ projectRef: 'default', search: selectedSearch }),
      { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }
    )
    rerender = rendered.rerender
    const { result } = rendered
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    vi.setSystemTime(now.getTime() + 5000)
    await act(async () => {
      await result.current.fetchNextPage()
    })
    await waitFor(() =>
      expect(result.current.data?.pages.flatMap((page) => page.data)).toHaveLength(100)
    )
    expect(requests[1].iso_timestamp_start).toBe(requests[0].iso_timestamp_start)
    expect(requests[1].iso_timestamp_end).toBe(requests[0].iso_timestamp_end)
    vi.setSystemTime(now.getTime() + 20_000)
    rows.push(createRow('fresh', (Date.now() - 1000) * 1000))
    await act(async () => {
      await result.current.refetch()
    })
    await waitFor(() =>
      expect(result.current.data?.pages.flatMap((page) => page.data).map((row) => row.id)).toEqual([
        'fresh',
      ])
    )
    expect(result.current.hasNextPage).toBe(false)
    expect(requests).toHaveLength(3)
    expect(requests[2].iso_timestamp_start).toBe('2026-09-30T12:00:10.000Z')
  })

  it('advances and prunes on empty polls, freezes on pause, and resumes the selected range', async () => {
    const rows = [
      createRow('expired', (now.getTime() - 12_000) * 1000),
      createRow('visible', (now.getTime() - 1000) * 1000),
    ]
    const requests = mockLogs(rows, true)
    let isLive = true
    const rendered = customRenderHook(
      () =>
        useUnifiedLogsLiveQuery({
          projectRef: 'default',
          search: selectedSearch,
          isLive,
          seed: now.getTime() - 20_000,
        }),
      { queryClient: new QueryClient() }
    )
    await act(async () => {
      await rendered.result.current.onPoll()
    })
    await waitFor(() =>
      expect(rendered.result.current.data?.rows.map((row) => row.id)).toEqual(['visible'])
    )
    expect(requests[0].iso_timestamp_start).toBe('2026-09-30T11:59:49.999Z')
    vi.setSystemTime(now.getTime() + 11_000)
    await act(async () => {
      await rendered.result.current.onPoll()
    })
    await waitFor(() => expect(rendered.result.current.data?.rows).toHaveLength(0))
    const anchor = rendered.result.current.data?.latestSuccessfulEnd
    expect(anchor).toBe(Date.now())
    isLive = false
    rendered.rerender()
    vi.setSystemTime(now.getTime() + 71_000)
    await act(async () => {
      await rendered.result.current.onPoll()
    })
    expect(rendered.result.current.data?.latestSuccessfulEnd).toBe(anchor)
    expect(requests).toHaveLength(2)
    rows.push(createRow('resumed', (Date.now() - 1000) * 1000))
    isLive = true
    rendered.rerender()
    await act(async () => {
      await rendered.result.current.onPoll()
    })
    await waitFor(() =>
      expect(rendered.result.current.data?.rows.map((row) => row.id)).toEqual(['resumed'])
    )
    expect(requests[2].iso_timestamp_start).toBe('2026-09-30T12:01:00.999Z')
  })

  it('keeps unfinished bounds and never rewinds the display when an older stream finishes', async () => {
    const rows = Array.from({ length: 120 }, (_, index) =>
      createRow(`burst-${index}`, (now.getTime() - 1000) * 1000 + 123)
    )
    const requests = mockLogs(rows, true)
    const { result } = customRenderHook(
      () =>
        useUnifiedLogsLiveQuery({
          projectRef: 'default',
          search: selectedSearch,
          isLive: true,
          seed: now.getTime() - 2000,
        }),
      { queryClient: new QueryClient() }
    )
    await act(async () => {
      await result.current.onPoll()
    })
    vi.setSystemTime(now.getTime() + 20_000)
    await act(async () => {
      await result.current.onPoll()
    })
    await waitFor(() => expect(result.current.data?.rows).toHaveLength(100))
    expect(requests[1].iso_timestamp_end).toBe(requests[0].iso_timestamp_end)
    rows.push(createRow('latest', (now.getTime() + 30_000) * 1000))
    vi.setSystemTime(now.getTime() + 31_000)
    await act(async () => {
      await result.current.onPoll()
    })
    await act(async () => {
      await result.current.onPoll()
    })
    await waitFor(() => expect(result.current.data?.rows.map((row) => row.id)).toEqual(['latest']))
    expect(result.current.data?.latestSuccessfulEnd).toBe(Date.now())
    expect(requests[3].iso_timestamp_end).toBe(now.toISOString())
    const displayed = filterUnifiedLogsWindow(
      [
        { id: 'outside', date: now },
        { id: 'inside', date: new Date(now.getTime() + 30_000) },
      ],
      10,
      result.current.data?.latestSuccessfulEnd
    )
    vi.setSystemTime(now.getTime() + 60_000)
    expect(displayed.map((row) => row.id)).toEqual(['inside'])
  })
})

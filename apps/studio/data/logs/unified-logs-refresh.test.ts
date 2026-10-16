import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import * as common from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useUnifiedLogsInfiniteQuery } from './unified-logs-infinite-query'
import { compareRows, createRow, mockLogs, now, search } from './unified-logs.test-utils'
import { deduplicateUnifiedLogs } from './unified-logs.utils'
import { customRenderHook } from '@/tests/lib/custom-render'

beforeEach(() => {
  vi.spyOn(common, 'useFeatureFlags').mockReturnValue({
    configcat: { otelUnifiedLogs: false },
    posthog: {},
    hasLoaded: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('unified logs refresh history', () => {
  it.each([false, true])('retains loaded pages after arrivals with otel=%s', async (useOtel) => {
    vi.spyOn(common, 'useFeatureFlags').mockReturnValue({
      configcat: { otelUnifiedLogs: useOtel },
      posthog: {},
      hasLoaded: true,
    })
    const timestamp = Date.now() - 10 * 60 * 1000
    const rows = Array.from({ length: 110 }, (_, index) =>
      createRow(`old-${String(index).padStart(3, '0')}`, (timestamp - index * 1000) * 1000 + 123)
    )
    mockLogs(rows, useOtel)
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
    expect(result.current.hasNextPage).toBe(true)
    await act(async () => {
      const response = await result.current.fetchNextPage()
      expect(response.error).toBeNull()
    })
    await waitFor(() => expect(displayedIds()).toHaveLength(100))
    const olderIds = displayedIds()
    const arrivals = Array.from({ length: 60 }, (_, index) =>
      createRow(`new-${String(index).padStart(3, '0')}`, (timestamp + 1000) * 1000 + 123)
    )
    rows.push(...arrivals)
    const expectedIds = [...arrivals]
      .sort(compareRows)
      .map((row) => row.id)
      .concat(olderIds)
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
    await waitFor(() => expect(new Set(displayedIds())).toEqual(new Set(rows.map((row) => row.id))))
  })

  it.each([
    { useOtel: false, initialCount: 1 },
    { useOtel: true, initialCount: 1 },
    { useOtel: false, initialCount: 60 },
    { useOtel: true, initialCount: 60 },
    { useOtel: false, initialCount: 50 },
    { useOtel: true, initialCount: 50 },
  ])(
    'refreshes late arrivals throughout an exhausted range with otel=$useOtel and $initialCount initial rows',
    async ({ useOtel, initialCount }) => {
      vi.spyOn(common, 'useFeatureFlags').mockReturnValue({
        configcat: { otelUnifiedLogs: useOtel },
        posthog: {},
        hasLoaded: true,
      })
      const timestamp = new Date('2026-09-30T11:50:00.000Z').getTime() * 1000 + 123
      const rows = Array.from({ length: initialCount }, (_, index) =>
        createRow(`log-${String(index).padStart(3, '0')}`, timestamp)
      )
      mockLogs(rows, useOtel)
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const selectedSearch = {
        ...search,
        date: [new Date('2026-09-30T11:00:00.000Z'), now],
      }
      const { result } = customRenderHook(
        () =>
          useUnifiedLogsInfiniteQuery({
            projectRef: 'default',
            search: selectedSearch,
          }),
        { queryClient }
      )
      const displayedIds = () =>
        deduplicateUnifiedLogs(result.current.data?.pages.flatMap((page) => page.data) ?? []).map(
          (row) => row.id
        )
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(displayedIds()).toHaveLength(Math.min(initialCount, 50))
      if (initialCount >= 50) {
        await act(async () => {
          const response = await result.current.fetchNextPage()
          expect(response.error).toBeNull()
        })
        await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
      }
      await waitFor(() => expect(displayedIds()).toHaveLength(initialCount))
      expect(result.current.hasNextPage).toBe(false)

      await act(async () => {
        await result.current.refetch()
      })
      await waitFor(() => expect(result.current.isFetching).toBe(false))
      expect(result.current.hasNextPage).toBe(false)

      rows.push(
        ...Array.from({ length: 60 }, (_, index) =>
          createRow(`aaa-late-${String(index).padStart(3, '0')}`, timestamp)
        ),
        createRow('older-late', new Date('2026-09-30T11:40:00.000Z').getTime() * 1000)
      )
      const expectedIds = [...rows].sort(compareRows).map((row) => row.id)
      rows.push(
        createRow('before-range', new Date('2026-09-30T10:59:59.000Z').getTime() * 1000),
        createRow('after-range', new Date('2026-09-30T12:00:01.000Z').getTime() * 1000)
      )
      for (let refresh = 0; refresh < 2; refresh++) {
        await act(async () => {
          const response = await result.current.refetch()
          expect(response.error).toBeNull()
        })
        await waitFor(() => expect(displayedIds()).toEqual(expectedIds))
        expect(result.current.hasNextPage).toBe(false)
      }
    }
  )
})

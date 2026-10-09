import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useLiveLogBatches } from './useLiveLogBatches'

const initialPage = { data: [{ id: 'initial' }] }
const arrivalPage = { data: [{ id: 'arrival' }, ...initialPage.data] }
const successfulPoll = { isError: false, data: { pages: [arrivalPage, initialPage] } }

function setup(firstPage: typeof initialPage | undefined = initialPage) {
  const fetchPreviousPage = vi.fn(async () => successfulPoll)
  const refetchLogs = vi.fn(async () => successfulPoll)
  const refetchCounts = vi.fn(async () => ({ isError: false }))
  const props: Pick<
    Parameters<typeof useLiveLogBatches>[0],
    'scope' | 'rows' | 'firstPage' | 'isPlaceholderData'
  > = {
    scope: 'original',
    rows: firstPage?.data ?? [],
    firstPage,
    isPlaceholderData: false,
  }
  const hook = renderHook(
    (current) => useLiveLogBatches({ ...current, fetchPreviousPage, refetchLogs, refetchCounts }),
    { initialProps: props }
  )
  return { ...hook, props, fetchPreviousPage, refetchLogs, refetchCounts }
}

describe('useLiveLogBatches', () => {
  it('treats a joined initial load as the baseline and marks the following arrival', async () => {
    const { result, rerender, props, fetchPreviousPage } = setup()
    rerender({ ...props, rows: [], firstPage: undefined })
    fetchPreviousPage.mockResolvedValueOnce({ isError: false, data: { pages: [initialPage] } })
    await act(async () => result.current.fetchLiveLogs())
    expect(result.current.batches).toEqual([])
    expect(result.current.unreadCount).toBe(0)

    rerender(props)
    await act(async () => result.current.fetchLiveLogs())
    rerender({ ...props, rows: arrivalPage.data, firstPage: arrivalPage })
    expect(result.current.batches).toEqual([{ ids: ['arrival'], refreshedAt: expect.any(Number) }])
    expect(result.current.rows.map((row) => row.id)).toEqual(['arrival', 'initial'])
    expect(result.current.unreadCount).toBe(1)
  })

  it('marks the first arrival after an empty loaded baseline', async () => {
    const { result, rerender, props } = setup({ data: [] })
    await act(async () => result.current.fetchLiveLogs())
    rerender({ ...props, rows: arrivalPage.data, firstPage: arrivalPage })
    expect(result.current.batches).toEqual([
      { ids: ['arrival', 'initial'], refreshedAt: expect.any(Number) },
    ])
    expect(result.current.unreadCount).toBe(2)
  })

  it('keeps the polling callback stable while arrivals and older pages update', async () => {
    const { result, rerender, props } = setup()
    const poll = result.current.fetchLiveLogs
    await act(async () => poll())
    rerender({ ...props, rows: [...arrivalPage.data, { id: 'older' }], firstPage: arrivalPage })
    expect(result.current.fetchLiveLogs).toBe(poll)
    expect(result.current.rows.map((row) => row.id)).toEqual(['arrival', 'initial', 'older'])
    expect(result.current.batches).toHaveLength(1)
  })

  it.each(['fetchLiveLogs', 'refreshLogs'] as const)(
    'rejects an inflight %s completion after a scope reset',
    async (action) => {
      const { result, rerender, props, fetchPreviousPage, refetchLogs, refetchCounts } = setup()
      await act(async () => result.current.fetchLiveLogs())
      expect(result.current.batches).toHaveLength(1)
      let resolvePoll = (_response: typeof successfulPoll) => {}
      const fetch = action === 'fetchLiveLogs' ? fetchPreviousPage : refetchLogs
      fetch.mockImplementationOnce(() => new Promise((resolve) => (resolvePoll = resolve)))
      let pending: ReturnType<typeof result.current.fetchLiveLogs>
      act(() => {
        pending = result.current[action]()
      })
      rerender({ ...props, scope: 'different', isPlaceholderData: true })
      rerender(props)
      expect(result.current.batches).toEqual([])
      expect(result.current.unreadCount).toBe(0)
      await act(async () => {
        resolvePoll(successfulPoll)
        await pending
      })
      expect(result.current.batches).toEqual([])
      expect(result.current.unreadCount).toBe(0)
      expect(refetchCounts).toHaveBeenCalledTimes(1)
    }
  )

  it('ignores placeholder data and failed polls', async () => {
    const { result, rerender, props, fetchPreviousPage, refetchCounts } = setup()
    rerender({ ...props, scope: 'different', isPlaceholderData: true })
    await act(async () => result.current.fetchLiveLogs())
    expect(fetchPreviousPage).not.toHaveBeenCalled()
    rerender({ ...props, scope: 'different' })
    fetchPreviousPage.mockResolvedValueOnce({ ...successfulPoll, isError: true })
    await act(async () => result.current.fetchLiveLogs())
    expect(result.current.batches).toEqual([])
    expect(result.current.unreadCount).toBe(0)
    expect(refetchCounts).not.toHaveBeenCalled()
  })

  it('accumulates unique arrivals until acknowledged without removing refresh markers', async () => {
    const { result, rerender, props, fetchPreviousPage } = setup()
    const sessionKey = result.current.sessionKey
    await act(async () => result.current.fetchLiveLogs())
    rerender({ ...props, rows: arrivalPage.data, firstPage: arrivalPage })
    const nextPage = { data: [{ id: 'second' }, { id: 'second' }, ...arrivalPage.data] }
    fetchPreviousPage.mockResolvedValue({
      isError: false,
      data: { pages: [nextPage, arrivalPage] },
    })
    await act(async () => result.current.fetchLiveLogs())
    expect(result.current.unreadCount).toBe(2)

    act(() => result.current.acknowledgeLiveLogs())
    expect(result.current.unreadCount).toBe(0)
    expect(result.current.batches).toHaveLength(2)
    expect(result.current.sessionKey).toBe(sessionKey)

    await act(async () => result.current.fetchLiveLogs())
    expect(result.current.unreadCount).toBe(0)
    expect(result.current.batches).toHaveLength(2)
  })

  it('does not count zero-result polls or older pagination', async () => {
    const { result, rerender, props, fetchPreviousPage } = setup()
    fetchPreviousPage.mockResolvedValue({
      isError: false,
      data: { pages: [{ data: [] }, initialPage] },
    })
    await act(async () => result.current.fetchLiveLogs())
    rerender({ ...props, rows: [...initialPage.data, { id: 'older' }] })
    expect(result.current.unreadCount).toBe(0)
    expect(result.current.batches).toEqual([])
  })

  it('counts overlapping polling completions once', async () => {
    const { result } = setup()
    await act(async () => {
      await Promise.all([result.current.fetchLiveLogs(), result.current.fetchLiveLogs()])
    })
    expect(result.current.unreadCount).toBe(1)
    expect(result.current.batches).toHaveLength(1)
  })

  it('adds arrivals from every refreshed page while retaining earlier markers and unread logs', async () => {
    const { result, rerender, props, fetchPreviousPage, refetchLogs, refetchCounts } = setup()
    const refresh = result.current.refreshLogs
    const sessionKey = result.current.sessionKey
    await act(async () => result.current.fetchLiveLogs())
    const liveBatch = result.current.batches[0]
    rerender({ ...props, rows: arrivalPage.data, firstPage: arrivalPage })
    const refreshedPages = [
      { data: [{ id: 'newest' }, ...arrivalPage.data] },
      { data: [{ id: 'late' }, { id: 'newest' }] },
    ]
    refetchLogs.mockResolvedValue({ isError: false, data: { pages: refreshedPages } })

    await act(async () => result.current.refreshLogs())
    rerender({
      ...props,
      rows: refreshedPages.flatMap((page) => page.data),
      firstPage: refreshedPages[0],
    })

    expect(result.current.batches).toEqual([
      { ids: ['newest', 'late'], refreshedAt: expect.any(Number) },
      liveBatch,
    ])
    expect(result.current.rows.map((row) => row.id)).toEqual([
      'newest',
      'late',
      'arrival',
      'initial',
    ])
    expect(result.current.unreadCount).toBe(3)
    expect(result.current.sessionKey).toBe(sessionKey)
    expect(result.current.refreshLogs).toBe(refresh)
    expect(fetchPreviousPage).toHaveBeenCalledTimes(1)
    expect(refetchLogs).toHaveBeenCalledTimes(1)
    expect(refetchCounts).toHaveBeenCalledTimes(2)
  })

  it('keeps manual initial loads as a baseline, including an empty loaded result', async () => {
    const { result, rerender, props, refetchLogs } = setup()
    rerender({ ...props, rows: [], firstPage: undefined })
    await act(async () => result.current.refreshLogs())
    expect(result.current.batches).toEqual([])

    rerender({ ...props, rows: [], firstPage: { data: [] } })
    refetchLogs.mockResolvedValue({ isError: false, data: { pages: [initialPage] } })
    await act(async () => result.current.refreshLogs())
    expect(result.current.batches).toEqual([{ ids: ['initial'], refreshedAt: expect.any(Number) }])
    expect(result.current.unreadCount).toBe(1)
  })

  it('preserves history through duplicate, empty, and failed manual responses', async () => {
    const { result, rerender, props, refetchLogs, refetchCounts } = setup()
    await act(async () => result.current.refreshLogs())
    rerender({ ...props, rows: arrivalPage.data, firstPage: arrivalPage })
    const batches = result.current.batches
    await act(async () => result.current.refreshLogs())
    refetchLogs.mockResolvedValueOnce({ isError: false, data: { pages: [{ data: [] }] } })
    await act(async () => result.current.refreshLogs())
    refetchLogs.mockResolvedValueOnce({ ...successfulPoll, isError: true })
    await act(async () => result.current.refreshLogs())

    expect(result.current.batches).toEqual(batches)
    expect(result.current.unreadCount).toBe(1)
    expect(refetchCounts).toHaveBeenCalledTimes(3)
  })

  it('ignores manual refreshes of placeholder rows', async () => {
    const { result, rerender, props, refetchLogs, refetchCounts } = setup()
    rerender({ ...props, isPlaceholderData: true })
    await act(async () => result.current.refreshLogs())
    expect(refetchLogs).not.toHaveBeenCalled()
    expect(refetchCounts).not.toHaveBeenCalled()
    expect(result.current.batches).toEqual([])
  })

  it('does not recount baseline or batched IDs that disappear and later return', async () => {
    const { result, rerender, props, refetchLogs } = setup()
    await act(async () => result.current.refreshLogs())
    const batches = result.current.batches
    act(() => result.current.acknowledgeLiveLogs())
    rerender({ ...props, rows: [], firstPage: { data: [] } })
    refetchLogs.mockResolvedValueOnce({ isError: false, data: { pages: [{ data: [] }] } })
    await act(async () => result.current.refreshLogs())
    await act(async () => result.current.refreshLogs())
    rerender({ ...props, rows: arrivalPage.data, firstPage: arrivalPage })
    expect(result.current.batches).toEqual(batches)
    expect(result.current.unreadCount).toBe(0)
    expect(result.current.rows.map((row) => row.id)).toEqual(['arrival', 'initial'])
  })

  it.each(['live', 'manual'] as const)(
    'deduplicates overlapping Live and manual completions when %s finishes first',
    async (first) => {
      const { result, fetchPreviousPage, refetchLogs } = setup()
      let resolveLive = (_response: typeof successfulPoll) => {}
      let resolveManual = (_response: typeof successfulPoll) => {}
      fetchPreviousPage.mockImplementationOnce(
        () => new Promise((resolve) => (resolveLive = resolve))
      )
      refetchLogs.mockImplementationOnce(() => new Promise((resolve) => (resolveManual = resolve)))
      let pendingLive: ReturnType<typeof result.current.fetchLiveLogs>
      let pendingManual: ReturnType<typeof result.current.refreshLogs>
      act(() => {
        pendingLive = result.current.fetchLiveLogs()
        pendingManual = result.current.refreshLogs()
      })
      const manualResponse = {
        isError: false,
        data: { pages: [arrivalPage, { data: [{ id: 'late' }, ...initialPage.data] }] },
      }
      await act(async () => {
        if (first === 'live') {
          resolveLive(successfulPoll)
          await pendingLive
        } else {
          resolveManual(manualResponse)
          await pendingManual
        }
      })
      await act(async () => {
        resolveLive(successfulPoll)
        resolveManual(manualResponse)
        await Promise.all([pendingLive, pendingManual])
      })
      expect(result.current.unreadCount).toBe(2)
      expect(result.current.batches.flatMap((batch) => batch.ids).sort()).toEqual([
        'arrival',
        'late',
      ])
    }
  )
})

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useLiveLogBatches } from './useLiveLogBatches'

const initialPage = { data: [{ id: 'initial' }] }
const arrivalPage = { data: [{ id: 'arrival' }, ...initialPage.data] }
const successfulPoll = { isError: false, data: { pages: [arrivalPage, initialPage] } }

function setup(firstPage: typeof initialPage | undefined = initialPage) {
  const fetchPreviousPage = vi.fn(async () => successfulPoll)
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
    (current) => useLiveLogBatches({ ...current, fetchPreviousPage, refetchCounts }),
    { initialProps: props }
  )
  return { ...hook, props, fetchPreviousPage, refetchCounts }
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

  it.each(['scope', 'refresh'])(
    'rejects an inflight completion after a %s reset',
    async (reset) => {
      const { result, rerender, props, fetchPreviousPage, refetchCounts } = setup()
      await act(async () => result.current.fetchLiveLogs())
      expect(result.current.batches).toHaveLength(1)
      let resolvePoll = (_response: typeof successfulPoll) => {}
      fetchPreviousPage.mockImplementationOnce(
        () => new Promise((resolve) => (resolvePoll = resolve))
      )
      let pending: ReturnType<typeof result.current.fetchLiveLogs>
      act(() => {
        pending = result.current.fetchLiveLogs()
      })
      if (reset === 'scope') {
        rerender({ ...props, scope: 'different', isPlaceholderData: true })
        rerender(props)
      } else {
        act(() => result.current.resetLiveBatches())
      }
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
})

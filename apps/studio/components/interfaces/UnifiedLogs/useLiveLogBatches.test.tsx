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

    rerender(props)
    await act(async () => result.current.fetchLiveLogs())
    rerender({ ...props, rows: arrivalPage.data, firstPage: arrivalPage })
    expect(result.current.batches).toEqual([{ ids: ['arrival'], refreshedAt: expect.any(Number) }])
    expect(result.current.rows.map((row) => row.id)).toEqual(['arrival', 'initial'])
  })

  it('marks the first arrival after an empty loaded baseline', async () => {
    const { result, rerender, props } = setup({ data: [] })
    await act(async () => result.current.fetchLiveLogs())
    rerender({ ...props, rows: arrivalPage.data, firstPage: arrivalPage })
    expect(result.current.batches).toEqual([
      { ids: ['arrival', 'initial'], refreshedAt: expect.any(Number) },
    ])
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
      await act(async () => {
        resolvePoll(successfulPoll)
        await pending
      })
      expect(result.current.batches).toEqual([])
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
    expect(refetchCounts).not.toHaveBeenCalled()
  })
})

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useLiveLogBatches } from './useLiveLogBatches'

function setup() {
  const fetchPreviousPage = vi.fn(async () => ({ isError: false }))
  const refetchCounts = vi.fn(async () => ({ isError: false }))
  const props = { scope: 'original', isPlaceholderData: false }
  const hook = renderHook(
    (current) => useLiveLogBatches({ ...current, fetchPreviousPage, refetchCounts }),
    { initialProps: props }
  )
  return { ...hook, props, fetchPreviousPage, refetchCounts }
}

describe('useLiveLogBatches', () => {
  it('keeps polling stable and refreshes counts after success', async () => {
    const { result, rerender, props, refetchCounts } = setup()
    const poll = result.current.fetchLiveLogs
    rerender({ ...props })
    expect(result.current.fetchLiveLogs).toBe(poll)
    await act(async () => poll())
    expect(refetchCounts).toHaveBeenCalledOnce()
  })

  it('rejects an inflight completion after leaving and returning to a scope', async () => {
    const { result, rerender, props, fetchPreviousPage, refetchCounts } = setup()
    let resolvePoll = (_response: { isError: boolean }) => {}
    fetchPreviousPage.mockImplementationOnce(
      () => new Promise((resolve) => (resolvePoll = resolve))
    )
    const pending = result.current.fetchLiveLogs()
    rerender({ ...props, scope: 'different' })
    rerender(props)
    await act(async () => {
      resolvePoll({ isError: false })
      await pending
    })
    expect(refetchCounts).not.toHaveBeenCalled()
  })

  it('ignores placeholder data and failed polls', async () => {
    const { result, rerender, props, fetchPreviousPage, refetchCounts } = setup()
    rerender({ ...props, isPlaceholderData: true })
    await act(async () => result.current.fetchLiveLogs())
    expect(fetchPreviousPage).not.toHaveBeenCalled()
    rerender(props)
    fetchPreviousPage.mockResolvedValueOnce({ isError: true })
    await act(async () => result.current.fetchLiveLogs())
    expect(refetchCounts).not.toHaveBeenCalled()
  })
})

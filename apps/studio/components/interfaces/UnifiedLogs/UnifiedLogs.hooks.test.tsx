import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useFilterSearchSync } from './UnifiedLogs.hooks'

describe('useFilterSearchSync', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('defers platform filter synchronization until feature flags load', () => {
    vi.useFakeTimers()
    const applyFilterSearch = vi.fn()
    const workersFilter = [{ id: 'log_type', value: ['workers'] }]
    const { rerender } = renderHook(
      ({ enabled }) =>
        useFilterSearchSync({ applyFilterSearch, columnFilters: workersFilter, enabled }),
      { initialProps: { enabled: false } }
    )

    act(() => vi.advanceTimersByTime(1_000))
    expect(applyFilterSearch).not.toHaveBeenCalled()

    rerender({ enabled: true })
    act(() => vi.advanceTimersByTime(250))

    expect(applyFilterSearch).toHaveBeenCalledOnce()
  })

  it('synchronizes self-hosted filters without waiting for feature flags', () => {
    vi.useFakeTimers()
    const applyFilterSearch = vi.fn()

    renderHook(() => useFilterSearchSync({ applyFilterSearch, columnFilters: [], enabled: true }))

    act(() => vi.advanceTimersByTime(250))

    expect(applyFilterSearch).toHaveBeenCalledOnce()
  })
})

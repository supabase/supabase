// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers())

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('cancels a pending callback when unmounted', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebounce(callback, 100))

    act(() => result.current())
    unmount()
    act(() => vi.advanceTimersByTime(100))

    expect(callback).not.toHaveBeenCalled()
  })

  it('cancels the old timer and uses the updated delay', () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(({ delay }) => useDebounce(callback, delay), {
      initialProps: { delay: 100 },
    })

    act(() => result.current())
    rerender({ delay: 200 })
    act(() => vi.advanceTimersByTime(100))
    expect(callback).not.toHaveBeenCalled()

    act(() => result.current())
    act(() => vi.advanceTimersByTime(199))
    expect(callback).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(callback).toHaveBeenCalledOnce()
  })

  it('uses the latest callback without restarting the pending timer', () => {
    const first = vi.fn()
    const latest = vi.fn()
    const { result, rerender } = renderHook(({ callback }) => useDebounce(callback, 100), {
      initialProps: { callback: first },
    })

    act(() => result.current())
    act(() => vi.advanceTimersByTime(50))
    rerender({ callback: latest })
    act(() => vi.advanceTimersByTime(50))

    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledOnce()
  })
})

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLongRunningTransitionState } from './useLongRunningTransitionState'

describe('useLongRunningTransitionState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('immediately marks the transition as long-running when the persisted timer has already elapsed', () => {
    const storageKey = 'project-transition-start'
    window.localStorage.setItem(storageKey, String(Date.now() - 61_000))

    const { result } = renderHook(() =>
      useLongRunningTransitionState({ storageKey, thresholdMs: 60_000 })
    )

    expect(result.current).toBe(true)
  })

  it('keeps a stable in-memory timer when no storage key is available', () => {
    const { result, rerender } = renderHook(
      ({ thresholdMs }: { thresholdMs: number }) =>
        useLongRunningTransitionState({ storageKey: null, thresholdMs }),
      {
        initialProps: { thresholdMs: 120_000 },
      }
    )

    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    rerender({ thresholdMs: 60_000 })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(30_000)
    })

    expect(result.current).toBe(true)
  })
})

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getSelect26PromotionPhase, useSelect26PromotionPhase } from './Select26Promotion'

afterEach(() => vi.useRealTimers())

describe('getSelect26PromotionPhase', () => {
  it.each([
    ['2026-10-02T07:59:59.999-07:00', 'waitlist'],
    ['2026-10-02T08:00:00-07:00', 'livestream'],
    ['2026-10-02T17:29:59.999-07:00', 'livestream'],
    ['2026-10-02T17:30:00-07:00', 'ended'],
    ['2026-10-02T17:30:00.001-07:00', 'ended'],
  ] as const)('returns %s as %s', (time, phase) => {
    expect(getSelect26PromotionPhase(new Date(time).getTime())).toBe(phase)
  })
})

describe('useSelect26PromotionPhase', () => {
  it('updates an open page at both boundaries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-02T07:59:59.999-07:00'))
    const { result } = renderHook(() => useSelect26PromotionPhase())

    expect(result.current).toBe('waitlist')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('livestream')

    act(() => vi.advanceTimersByTime(9.5 * 60 * 60 * 1000))
    expect(result.current).toBe('ended')
  })

  it('refreshes after a background tab resumes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-02T07:00:00-07:00'))
    const { result } = renderHook(() => useSelect26PromotionPhase())

    vi.setSystemTime(new Date('2026-10-02T08:30:00-07:00'))
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(result.current).toBe('livestream')

    vi.setSystemTime(new Date('2026-10-02T17:31:00-07:00'))
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    expect(result.current).toBe('ended')
  })
})

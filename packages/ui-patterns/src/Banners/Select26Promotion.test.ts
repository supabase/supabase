import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { isSelect26PromotionActive, useSelect26PromotionActive } from './Select26Promotion'

afterEach(() => vi.useRealTimers())

describe('isSelect26PromotionActive', () => {
  it('is active immediately before the campaign expiry', () => {
    expect(isSelect26PromotionActive(new Date('2026-10-02T23:59:59.999-07:00').getTime())).toBe(
      true
    )
  })

  it('is inactive at the campaign expiry', () => {
    expect(isSelect26PromotionActive(new Date('2026-10-03T00:00:00-07:00').getTime())).toBe(false)
  })

  it('is inactive after the campaign expiry', () => {
    expect(isSelect26PromotionActive(new Date('2026-10-03T00:00:00.001-07:00').getTime())).toBe(
      false
    )
  })

  it('becomes inactive when an open page reaches the expiry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-02T23:59:59.999-07:00'))
    const { result } = renderHook(() => useSelect26PromotionActive())

    expect(result.current).toBe(true)

    act(() => vi.advanceTimersByTime(1))

    expect(result.current).toBe(false)
  })
})

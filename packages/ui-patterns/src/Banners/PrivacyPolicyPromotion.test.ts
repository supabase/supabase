import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  isLiveAt,
  isPrivacyPolicyBannerActive,
  usePrivacyPolicyBannerActive,
} from './PrivacyPolicyPromotion'

afterEach(() => vi.useRealTimers())

describe('isPrivacyPolicyBannerActive', () => {
  it('is inactive with no go-live date scheduled, however far in the future "now" is', () => {
    expect(isPrivacyPolicyBannerActive(Date.now())).toBe(false)
    expect(isPrivacyPolicyBannerActive(new Date('2099-01-01').getTime())).toBe(false)
  })
})

describe('isLiveAt', () => {
  const liveDateMs = new Date('2026-10-01T08:00:00-07:00').getTime()

  it('is never live when there is no scheduled date', () => {
    expect(isLiveAt(Date.now(), null)).toBe(false)
  })

  it('is inactive before the go-live date', () => {
    expect(isLiveAt(liveDateMs - 1, liveDateMs)).toBe(false)
  })

  it('is active at and after the go-live date', () => {
    expect(isLiveAt(liveDateMs, liveDateMs)).toBe(true)
    expect(isLiveAt(liveDateMs + 1, liveDateMs)).toBe(true)
  })
})

describe('usePrivacyPolicyBannerActive', () => {
  it('stays inactive over time when no go-live date is scheduled', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => usePrivacyPolicyBannerActive())

    expect(result.current).toBe(false)

    act(() => vi.advanceTimersByTime(365 * 24 * 60 * 60 * 1000))

    expect(result.current).toBe(false)
  })
})

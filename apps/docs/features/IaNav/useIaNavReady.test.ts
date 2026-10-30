// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { useFeatureFlags, useSearchParamsShallow } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IA_NAV_FLAG } from './constants'
import { useIaNavReady } from './useIaNavReady'

vi.mock('common', () => ({
  useFeatureFlags: vi.fn(),
  useSearchParamsShallow: vi.fn(),
}))

function renderReady({ hasLoaded = false, override }: { hasLoaded?: boolean; override?: string }) {
  vi.mocked(useFeatureFlags).mockReturnValue({ posthog: {}, hasLoaded } as unknown as ReturnType<
    typeof useFeatureFlags
  >)
  vi.mocked(useSearchParamsShallow).mockReturnValue(
    new URLSearchParams(override ? { [IA_NAV_FLAG]: override } : {}) as unknown as ReturnType<
      typeof useSearchParamsShallow
    >
  )

  return renderHook(() => useIaNavReady())
}

describe('useIaNavReady', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is not ready while the flags are loading', () => {
    const { result } = renderReady({})

    expect(result.current).toBe(false)
  })

  it('is ready once the flags load', () => {
    const { result } = renderReady({ hasLoaded: true })

    expect(result.current).toBe(true)
  })

  it('is ready when the query param forces a variant', () => {
    const { result } = renderReady({ override: 'option-1' })

    expect(result.current).toBe(true)
  })

  it('is ready after a second if the flags never load', () => {
    const { result } = renderReady({})

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(true)
  })
})

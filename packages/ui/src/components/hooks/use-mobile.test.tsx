import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useIsMobile } from './use-mobile'

const mockMatchMedia = (initialMatches: boolean) => {
  let listener: (() => void) | undefined
  const mql = {
    matches: initialMatches,
    addEventListener: vi.fn((_event: string, cb: () => void) => {
      listener = cb
    }),
    removeEventListener: vi.fn(),
  }
  window.matchMedia = vi.fn().mockReturnValue(mql)
  return {
    mql,
    fireChange: (matches: boolean) => {
      mql.matches = matches
      act(() => listener?.())
    },
  }
}

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('queries the exact complement of Tailwind\'s `md` breakpoint (min-width: 48rem)', () => {
    mockMatchMedia(false)

    renderHook(() => useIsMobile())

    // Media Queries Level 4 range syntax, not an approximated max-width
    // offset — this is what keeps it from ever disagreeing with Tailwind's
    // `md:` classes (see comment in use-mobile.tsx for why an offset isn't
    // safe here).
    expect(window.matchMedia).toHaveBeenCalledWith('(width < 48rem)')
  })

  it('returns true when the viewport is below the breakpoint', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('returns false when the viewport is at or above the breakpoint', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('updates when the media query match changes', () => {
    const { fireChange } = mockMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    fireChange(true)

    expect(result.current).toBe(true)
  })
})

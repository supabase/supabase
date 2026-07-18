import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useBreakpoint } from './useBreakpoint'

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

describe('useBreakpoint', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("queries the exact complement of Tailwind's `md` breakpoint (min-width: 48rem)", () => {
    mockMatchMedia(false)

    renderHook(() => useBreakpoint('md'))

    // `md` maps to 767 (Tailwind's min-width breakpoint minus 1, per the
    // documented max-width-logic offset), so the exact complement of
    // Tailwind's own `min-width: 48rem` is `width < 48rem` — not an
    // approximated `max-width: 47.9375rem`, which can leave a sub-pixel gap
    // where neither query matches (see comment in useBreakpoint.tsx).
    expect(window.matchMedia).toHaveBeenCalledWith('(width < 48rem)')
  })

  it('queries the exact complement for a raw numeric breakpoint', () => {
    mockMatchMedia(false)

    // 1023 is Tailwind's `lg` breakpoint (1024px) minus 1.
    renderHook(() => useBreakpoint(1023))

    expect(window.matchMedia).toHaveBeenCalledWith('(width < 64rem)')
  })

  it('returns true when the viewport is below the breakpoint', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useBreakpoint('md'))

    expect(result.current).toBe(true)
  })

  it('returns false when the viewport is at or above the breakpoint', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useBreakpoint('md'))

    expect(result.current).toBe(false)
  })

  it('updates when the media query match changes', () => {
    const { fireChange } = mockMatchMedia(false)

    const { result } = renderHook(() => useBreakpoint('md'))
    expect(result.current).toBe(false)

    fireChange(true)

    expect(result.current).toBe(true)
  })
})

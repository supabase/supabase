'use client'

import { useState } from 'react'
import { useIsomorphicLayoutEffect } from 'react-use'

/**
 * Map of Tailwind default breakpoint values. Allows setting a value by
 * Tailwind breakpoint, so that it syncs up with CSS changes.
 *
 * Note Tailwind uses `min-width` logic, whereas we use `max-width` logic, so
 * the values are offset by 1px.
 *
 * Source:
 * https://tailwindcss.com/docs/responsive-design
 */
const twBreakpointMap = {
  sm: 639,
  md: 767,
  lg: 1023,
  xl: 1279,
  '2xl': 1535,
}

export function useBreakpoint(breakpoint: number | keyof typeof twBreakpointMap = 'lg') {
  const _breakpoint = typeof breakpoint === 'string' ? twBreakpointMap[breakpoint] : breakpoint

  const [isBreakpoint, setIsBreakpoint] = useState(false)

  useIsomorphicLayoutEffect(() => {
    // Queried in rem (not compared as a raw px window width) so this stays in
    // sync with Tailwind's own rem-based breakpoints regardless of the root
    // font size. Comparing a raw px window width against this same constant
    // can drift out of sync with co-located `md:`-style CSS classes whenever
    // the root font size isn't exactly 16px (e.g. browser zoom/accessibility
    // text scaling behaving differently across browsers), which can leave an
    // element with no matching render path — neither the "mobile" nor the
    // "desktop" variant renders.
    //
    // `_breakpoint` is already Tailwind's breakpoint minus 1 (per the offset
    // noted above), so `_breakpoint + 1` recovers Tailwind's actual
    // `min-width`. Querying with the Media Queries Level 4 range syntax
    // (`width < Xrem`) makes this the exact logical complement of that
    // `min-width` — unlike an approximated `max-width: (X - epsilon)rem`,
    // there's no sub-pixel gap where a fractional viewport width satisfies
    // neither query.
    const mql = window.matchMedia(`(width < ${(_breakpoint + 1) / 16}rem)`)
    const onChange = () => setIsBreakpoint(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [_breakpoint])

  return isBreakpoint
}

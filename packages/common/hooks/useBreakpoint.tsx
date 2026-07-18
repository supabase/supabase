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
    // Rem, not px, to match Tailwind's breakpoints exactly — a px comparison
    // can drift out of sync with co-located `md:`-style classes. `+1` recovers
    // Tailwind's actual min-width from our offset value; range syntax keeps
    // this the exact complement of it.
    const mql = window.matchMedia(`(width < ${(_breakpoint + 1) / 16}rem)`)
    const onChange = () => setIsBreakpoint(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [_breakpoint])

  return isBreakpoint
}

import { useState } from 'react'
import { useIsomorphicLayoutEffect, useWindowSize } from 'react-use'

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
  xl: 1027,
  '2xl': 1535,
}

export function useBreakpoint(breakpoint: number | keyof typeof twBreakpointMap = 'lg') {
  const [isBreakpoint, setIsBreakpoint] = useState(false)
  const { width } = useWindowSize()

  const _breakpoint = typeof breakpoint === 'string' ? twBreakpointMap[breakpoint] : breakpoint

  useIsomorphicLayoutEffect(() => {
    if (width <= _breakpoint) {
      setIsBreakpoint(true)
    } else {
      setIsBreakpoint(false)
    }
  }, [width])

  return isBreakpoint
}

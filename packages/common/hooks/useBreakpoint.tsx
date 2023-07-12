import { useEffect, useState } from 'react'
import { useWindowSize } from 'react-use'

export const isBrowser = typeof window !== 'undefined'

export function useBreakpoint(breakpoint = 768) {
  if (!isBrowser) return
  const [isBreakpoint, setIsBreakpoint] = useState(false)
  const { width } = useWindowSize()

  useEffect(() => {
    if (width <= breakpoint) {
      setIsBreakpoint(true)
    } else {
      setIsBreakpoint(false)
    }
  }, [width])

  return isBreakpoint
}

import { useEffect, useState } from 'react'
import { useWindowSize } from 'react-use'
import { isBrowser } from '~/lib/helpers'

export function useMobileViewport(breakpoint = 768) {
  if (!isBrowser) return
  const [isMobile, setIsMobile] = useState(false)
  const { width } = useWindowSize()

  useEffect(() => {
    if (width <= breakpoint) {
      setIsMobile(true)
    } else {
      setIsMobile(false)
    }
  }, [width])

  return isMobile
}

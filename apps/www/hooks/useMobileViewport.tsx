import { useEffect, useState } from 'react'
import { useWindowSize } from 'react-use'

export function useMobileViewport(breakpoint = 768) {
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

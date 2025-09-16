import { useCallback, useEffect, useState, type RefObject } from 'react'

export function useFullscreen(containerRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handler)

    return () => {
      document.removeEventListener('fullscreenchange', handler)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return

    try {
      if (!isFullscreen) {
        await el.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (e) {
      console.error('Failed to toggle fullscreen mode:', e)
    }
  }, [containerRef, isFullscreen])

  return { isFullscreen, toggleFullscreen }
}

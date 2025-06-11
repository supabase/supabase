import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAutoScrollProps {
  enabled?: boolean
}

export function useAutoScroll({ enabled = true }: UseAutoScrollProps = {}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [isSticky, setIsSticky] = useState(true)
  const isStickyRef = useRef(true)
  const lastScrollHeightRef = useRef<number>()

  const ref = useCallback((element: HTMLDivElement | null) => {
    if (element) {
      setContainer(element)
    }
  }, [])

  const scrollToEnd = useCallback(() => {
    if (container) {
      isStickyRef.current = true
      setIsSticky(true)
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [container])

  useEffect(() => {
    if (!container || !enabled) return

    let timeoutId: NodeJS.Timeout

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (
          lastScrollHeightRef.current !== undefined &&
          container.scrollHeight !== lastScrollHeightRef.current
        ) {
          lastScrollHeightRef.current = container.scrollHeight
          if (isStickyRef.current) {
            scrollToEnd()
          }
        }
      }, 100)
    })

    const handleScroll = () => {
      const isAtBottom =
        Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10

      isStickyRef.current = isAtBottom
      setIsSticky(isAtBottom)
    }

    // Observe all children of the container
    Array.from(container.children).forEach((child) => {
      resizeObserver.observe(child)
    })

    container.addEventListener('scroll', handleScroll)

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      container.removeEventListener('scroll', handleScroll)
    }
  }, [container, enabled, scrollToEnd])

  return { ref, isSticky, scrollToEnd }
}

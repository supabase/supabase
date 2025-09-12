import { useLayoutEffect, useState } from 'react'

export const useMeasuredWidth = <T extends HTMLElement>(ref: React.RefObject<T>) => {
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const initial = element.getBoundingClientRect().width
    setMeasuredWidth((prev) => (prev === initial ? prev : initial))

    if (typeof ResizeObserver !== 'undefined') {
      let frame = 0
      const resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width ?? 0
        if (frame) cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          setMeasuredWidth((prev) => (prev === width ? prev : width))
        })
      })
      resizeObserver.observe(element)
      return () => {
        if (frame) cancelAnimationFrame(frame)
        resizeObserver.disconnect()
      }
    } else {
      const handleResize = () => {
        const width = element.getBoundingClientRect().width
        setMeasuredWidth((prev) => (prev === width ? prev : width))
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [ref])

  return measuredWidth
}

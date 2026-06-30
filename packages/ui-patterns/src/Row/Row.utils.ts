import { useLayoutEffect, useState } from 'react'

export const useMeasuredWidth = <T extends HTMLElement>(ref: React.RefObject<T | null>) => {
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

const findClippingAncestor = (element: HTMLElement) => {
  let node = element.parentElement
  while (node) {
    const overflowX = getComputedStyle(node).overflowX
    if (
      overflowX === 'hidden' ||
      overflowX === 'auto' ||
      overflowX === 'scroll' ||
      overflowX === 'clip'
    ) {
      return node
    }
    node = node.parentElement
  }
  return null
}

// Distance from the row's own edges out to the nearest ancestor that clips
// horizontal overflow. Items bleed past the row's box to that clip edge, so the
// arrows are offset by these insets to sit on the visible edge rather than on
// the row's (often narrower, centered) box.
export const useClipInsets = <T extends HTMLElement>(ref: React.RefObject<T | null>) => {
  const [insets, setInsets] = useState({ left: 0, right: 0 })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => {
      const clip = findClippingAncestor(element)
      const row = element.getBoundingClientRect()
      const bounds = clip
        ? clip.getBoundingClientRect()
        : { left: 0, right: document.documentElement.clientWidth }
      const left = Math.max(0, row.left - bounds.left)
      const right = Math.max(0, bounds.right - row.right)
      setInsets((prev) => (prev.left === left && prev.right === right ? prev : { left, right }))
    }

    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    let frame = 0
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const resizeObserver = new ResizeObserver(schedule)
    resizeObserver.observe(element)
    const clip = findClippingAncestor(element)
    if (clip) resizeObserver.observe(clip)
    window.addEventListener('resize', schedule)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [ref])

  return insets
}

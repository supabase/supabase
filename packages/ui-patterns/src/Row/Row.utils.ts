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

// Overflow values that establish a clipping box on the horizontal axis.
const CLIPPING_OVERFLOW_VALUES = new Set(['hidden', 'auto', 'scroll', 'clip'])

export const findClippingAncestor = (element: HTMLElement) => {
  let node = element.parentElement
  while (node) {
    if (CLIPPING_OVERFLOW_VALUES.has(getComputedStyle(node).overflowX)) {
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

    const measure = (clip = findClippingAncestor(element)) => {
      const row = element.getBoundingClientRect()
      const bounds = clip
        ? clip.getBoundingClientRect()
        : { left: 0, right: document.documentElement.clientWidth }
      const left = Math.max(0, row.left - bounds.left)
      const right = Math.max(0, bounds.right - row.right)
      setInsets((prev) => (prev.left === left && prev.right === right ? prev : { left, right }))
    }

    const clip = findClippingAncestor(element)
    measure(clip)

    if (typeof ResizeObserver === 'undefined') {
      const onResize = () => measure()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }

    let frame = 0
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => measure())
    }
    const resizeObserver = new ResizeObserver(schedule)
    // Observing both the row and its clip ancestor covers viewport resizes too:
    // when the clip ancestor is the scroll container, its size tracks the
    // viewport, so a separate window listener would be redundant.
    resizeObserver.observe(element)
    if (clip) resizeObserver.observe(clip)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      resizeObserver.disconnect()
    }
  }, [ref])

  return insets
}

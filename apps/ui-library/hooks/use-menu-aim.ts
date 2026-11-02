'use client'

import { useEffect, useRef, type PointerEvent } from 'react'

// Keep the selected category while the pointer travels toward its content panel.
export function useMenuAim(activeCategory: string, onCategoryChange: (category: string) => void) {
  const previousPoint = useRef<{ x: number; y: number } | null>(null)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelPending() {
    if (timeout.current !== null) clearTimeout(timeout.current)
    timeout.current = null
  }

  function reset() {
    cancelPending()
    previousPoint.current = null
  }

  useEffect(() => {
    return () => {
      if (timeout.current !== null) clearTimeout(timeout.current)
    }
  }, [])

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return

    const previous = previousPoint.current
    const point = { x: event.clientX, y: event.clientY }
    previousPoint.current = point
    const target = event.target instanceof Element ? event.target : null
    const tab = target?.closest<HTMLElement>('[data-menu-category]')
    const category = tab?.dataset.menuCategory
    cancelPending()
    if (!category || category === activeCategory) return

    const list = tab?.closest('[role="tablist"]')?.getBoundingClientRect()
    const panel = event.currentTarget.getBoundingClientRect()
    if (previous && list && previous.x < point.x && point.x < list.right) {
      const progress = (point.x - previous.x) / (list.right - previous.x)
      const top = previous.y + (panel.top - previous.y) * progress
      const bottom = previous.y + (panel.bottom - previous.y) * progress
      if (point.y >= top && point.y <= bottom) {
        timeout.current = setTimeout(() => onCategoryChange(category), 300)
        return
      }
    }

    onCategoryChange(category)
  }

  function selectCategory(category: string) {
    reset()
    onCategoryChange(category)
  }

  return { onPointerMove, onPointerLeave: reset, selectCategory }
}

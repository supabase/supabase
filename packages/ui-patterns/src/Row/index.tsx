'use client'

import type React from 'react'
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { Button, cn } from 'ui'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  // columns can be a fixed number or an array [lg, md, sm]
  columns: number | [number, number, number]
  children: ReactNode
  className?: string
  /** gap between items in pixels */
  gap?: number
  /** show left/right arrow buttons */
  showArrows?: boolean
  /** scrolling behavior for arrow navigation */
  scrollBehavior?: ScrollBehavior
}

export const Row = forwardRef<HTMLDivElement, RowProps>(function Row(
  { columns, children, className, gap = 16, showArrows = true, scrollBehavior = 'smooth', ...rest },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null)
  // We forward the ref to the outer wrapper; consumers needing the scroll container
  // can use a separate ref prop in the future if required.

  const childrenArray = useMemo(() => (Array.isArray(children) ? children : [children]), [children])

  const [scrollPosition, setScrollPosition] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)

  const resolveColumnsForWidth = (width: number): number => {
    if (!Array.isArray(columns)) return columns
    // Interpret as [lg, md, sm]
    const [lgCols, mdCols, smCols] = columns
    if (width >= 1024) return lgCols
    if (width >= 768) return mdCols
    return smCols
  }

  const getRenderColumns = (): number => {
    const width = containerRef.current?.getBoundingClientRect().width ?? 0
    return resolveColumnsForWidth(width)
  }

  const scrollByStep = (direction: -1 | 1) => {
    const el = containerRef.current
    if (!el) return
    const widthLocal = el.getBoundingClientRect().width
    const colsLocal = resolveColumnsForWidth(widthLocal)
    const columnWidth = (widthLocal - (colsLocal - 1) * gap) / colsLocal
    const scrollAmount = columnWidth + gap
    setScrollPosition((prev) => Math.max(0, Math.min(maxScroll, prev + direction * scrollAmount)))
  }

  const scrollLeft = () => scrollByStep(-1)
  const scrollRight = () => scrollByStep(1)

  const canScrollLeft = scrollPosition > 0
  const canScrollRight = scrollPosition < maxScroll

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const computeMaxScroll = (width: number) => {
      const colsLocal = resolveColumnsForWidth(width)
      const columnWidth = (width - (colsLocal - 1) * gap) / colsLocal
      const totalWidth = childrenArray.length * columnWidth + (childrenArray.length - 1) * gap
      const maxScrollValue = Math.max(0, totalWidth - width)
      setMaxScroll(maxScrollValue)
    }

    // Initial calculation
    computeMaxScroll(element.getBoundingClientRect().width)

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          computeMaxScroll(entry.contentRect.width)
        }
      })
      resizeObserver.observe(element)
      return () => resizeObserver.disconnect()
    } else {
      const handleResize = () => computeMaxScroll(element.getBoundingClientRect().width)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [childrenArray.length, gap, columns])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        if (e.deltaX !== 0) {
          e.preventDefault()

          const scrollAmount = Math.abs(e.deltaX) * 2
          const direction = e.deltaX > 0 ? 1 : -1

          setScrollPosition((prev) => {
            const newPosition = prev + scrollAmount * direction
            return Math.max(0, Math.min(maxScroll, newPosition))
          })
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [maxScroll])

  useEffect(() => {
    setScrollPosition((prev) => Math.min(prev, maxScroll))
  }, [maxScroll])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (containerRef.current && document.activeElement === containerRef.current) {
        if (e.key === 'ArrowLeft' && canScrollLeft) {
          e.preventDefault()
          scrollLeft()
        } else if (e.key === 'ArrowRight' && canScrollRight) {
          e.preventDefault()
          scrollRight()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [canScrollLeft, canScrollRight])

  return (
    <div ref={ref} className={cn('relative w-full', className)} {...rest}>
      {showArrows && canScrollLeft && (
        <Button
          type="default"
          onClick={scrollLeft}
          className="absolute w-8 h-8 left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {showArrows && canScrollRight && (
        <Button
          type="default"
          onClick={scrollRight}
          className="absolute w-8 h-8 right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}

      <div
        ref={containerRef}
        className="w-full overflow-visible focus:outline-none"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Horizontally scrollable content"
      >
        <div
          className="flex items-stretch min-w-full transition-transform duration-300 ease-out"
          style={
            {
              gap: `${gap}px`,
              '--column-width': `calc((100% - ${(getRenderColumns() - 1) * gap}px) / ${getRenderColumns()})`,
              transform: `translateX(-${scrollPosition}px)`,
            } as React.CSSProperties
          }
        >
          {childrenArray.map((child, index) => (
            <div key={index} className="flex-shrink-0" style={{ width: 'var(--column-width)' }}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

Row.displayName = 'Row'

'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type React from 'react'
import type { ReactNode } from 'react'
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { Button, cn } from 'ui'

import { useMeasuredWidth } from './Row.utils'

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

  const childrenArray = useMemo(() => (Array.isArray(children) ? children : [children]), [children])

  const [scrollPosition, setScrollPosition] = useState(0)
  const measuredWidth = useMeasuredWidth(containerRef)

  const resolveColumnsForWidth = (width: number): number => {
    if (!Array.isArray(columns)) return columns
    // Interpret as [lg, md, sm]
    const [lgCols, mdCols, smCols] = columns
    if (width >= 1024) return lgCols
    if (width >= 768) return mdCols
    return smCols
  }

  const numberOfColumns = useMemo(
    () => resolveColumnsForWidth(measuredWidth ?? 0),
    [measuredWidth, columns]
  )

  const scrollByStep = (direction: -1 | 1) => {
    const el = containerRef.current
    if (!el) return
    const widthLocal = measuredWidth ?? el.getBoundingClientRect().width
    const colsLocal = numberOfColumns
    const columnWidth = (widthLocal - (colsLocal - 1) * gap) / colsLocal
    const scrollAmount = columnWidth + gap
    setScrollPosition((prev) => {
      const next = Math.max(0, Math.min(maxScroll, prev + direction * scrollAmount))
      return next === prev ? prev : next
    })
  }

  const scrollLeft = () => scrollByStep(-1)
  const scrollRight = () => scrollByStep(1)

  const maxScroll = useMemo(() => {
    if (measuredWidth == null) return -1
    const colsLocal = numberOfColumns
    const columnWidth = (measuredWidth - (colsLocal - 1) * gap) / colsLocal
    const totalWidth = childrenArray.length * columnWidth + (childrenArray.length - 1) * gap
    return Math.max(0, totalWidth - measuredWidth)
  }, [measuredWidth, numberOfColumns, childrenArray.length, gap])

  const canScrollLeft = scrollPosition > 0
  const canScrollRight = scrollPosition < maxScroll

  const hasContentToScroll = childrenArray.length > numberOfColumns

  const rafIdRef = useRef(0 as number)
  const pendingDeltaRef = useRef(0)

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (e.deltaX === 0) return

    const delta = Math.abs(e.deltaX) * 2 * (e.deltaX > 0 ? 1 : -1)
    pendingDeltaRef.current += delta

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = 0
        const accumulated = pendingDeltaRef.current
        pendingDeltaRef.current = 0
        setScrollPosition((prev) => {
          const target = prev + accumulated
          const next = Math.max(0, Math.min(maxScroll, target))
          return next === prev ? prev : next
        })
      })
    }
  }

  useEffect(() => {
    setScrollPosition((prev) => {
      const next = Math.min(prev, maxScroll)
      return next === prev ? prev : next
    })
  }, [maxScroll])

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'ArrowLeft' && canScrollLeft) {
      e.preventDefault()
      scrollLeft()
    } else if (e.key === 'ArrowRight' && canScrollRight) {
      e.preventDefault()
      scrollRight()
    }
  }

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

      {showArrows && canScrollRight && hasContentToScroll && (
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
        style={{ overscrollBehaviorX: 'contain' }}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
      >
        <div
          className="flex items-stretch min-w-full transition-transform duration-300 ease-out"
          style={
            {
              gap: `${gap}px`,
              '--column-width': `calc((100% - ${(numberOfColumns - 1) * gap}px) / ${numberOfColumns})`,
              transform: `translateX(-${scrollPosition}px)`,
              willChange: 'transform',
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

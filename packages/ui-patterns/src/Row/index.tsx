'use client'

import type React from 'react'
import { Button, cn } from 'ui'
import type { ReactNode } from 'react'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface RowProps {
  // columns can be a fixed number or an array [lg, md, sm]
  columns: number | [number, number, number]
  children: ReactNode
  className?: string
}

export function Row({ columns, children, className }: RowProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const childrenArray = Array.isArray(children) ? children : [children]
  const totalItems = childrenArray.length

  const resolveColumnsForWidth = (width: number): number => {
    if (!Array.isArray(columns)) return columns
    // Interpret as [lg, md, sm]
    const [lgCols, mdCols, smCols] = columns
    if (width >= 1024) return lgCols
    if (width >= 768) return mdCols
    return smCols
  }

  const getRenderColumns = (): number => {
    const width = containerRef.current?.offsetWidth ?? containerWidth
    return resolveColumnsForWidth(width || 0)
  }

  const scrollLeft = () => {
    if (containerRef.current) {
      const widthLocal = containerRef.current.offsetWidth
      const colsLocal = resolveColumnsForWidth(widthLocal)
      const columnWidth = (widthLocal - (colsLocal - 1) * 16) / colsLocal
      const scrollAmount = columnWidth + 16 // column width + gap
      setScrollPosition((prev) => Math.max(0, prev - scrollAmount))
    }
  }

  const scrollRight = () => {
    if (containerRef.current) {
      const widthLocal = containerRef.current.offsetWidth
      const colsLocal = resolveColumnsForWidth(widthLocal)
      const columnWidth = (widthLocal - (colsLocal - 1) * 16) / colsLocal
      const scrollAmount = columnWidth + 16 // column width + gap
      setScrollPosition((prev) => Math.min(maxScroll, prev + scrollAmount))
    }
  }

  const canScrollLeft = scrollPosition > 0
  const canScrollRight = scrollPosition < maxScroll

  useEffect(() => {
    if (containerRef.current) {
      const containerWidthLocal = containerRef.current.offsetWidth
      const colsLocal = resolveColumnsForWidth(containerWidthLocal)
      const columnWidth = (containerWidthLocal - (colsLocal - 1) * 16) / colsLocal // 16px = 1rem gap
      const totalWidth = totalItems * columnWidth + (totalItems - 1) * 16
      const maxScrollValue = Math.max(0, totalWidth - containerWidthLocal)
      setMaxScroll(maxScrollValue)
    }
  }, [totalItems, containerWidth])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    // Initialize width
    setContainerWidth(element.offsetWidth)

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width)
        }
      })
      resizeObserver.observe(element)
      return () => resizeObserver.disconnect()
    } else {
      const handleResize = () => setContainerWidth(element.offsetWidth)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        if (e.deltaX !== 0) {
          e.preventDefault()

          const scrollAmount = Math.abs(e.deltaX) * 2
          const direction = e.deltaX > 0 ? 1 : -1 // Positive = scroll right

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
    <div className={cn('relative w-full', className)}>
      {canScrollLeft && (
        <Button
          type="default"
          onClick={scrollLeft}
          className="absolute w-8 h-8 left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {canScrollRight && (
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
        className="w-full overflow: visible focus:outline-none" // removed focus ring styling
        tabIndex={0}
        role="region"
        aria-label="Horizontally scrollable content"
      >
        <div
          className="flex items-stretch gap-4 min-w-full transition-transform duration-300 ease-out"
          style={
            {
              '--column-width': `calc((100% - ${(getRenderColumns() - 1) * 1}rem) / ${getRenderColumns()})`,
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
}

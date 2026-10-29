'use client'

import { useMountEffect } from 'common/hooks/useMountEffect'
import { useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { cn } from 'ui'

import type { ScreenRect } from './capture-screenshot'

export interface ScreenshotAreaProps {
  onAreaSelect: (area: ScreenRect) => void
  onCancel: () => void
}

interface Point {
  x: number
  y: number
}

export const ScreenshotArea = ({ onAreaSelect, onCancel }: ScreenshotAreaProps) => {
  const [drag, setDrag] = useState<{ start: Point; end: Point } | null>(null)
  const area: ScreenRect | null = drag
    ? {
        left: Math.min(drag.start.x, drag.end.x),
        top: Math.min(drag.start.y, drag.end.y),
        width: Math.abs(drag.end.x - drag.start.x),
        height: Math.abs(drag.end.y - drag.start.y),
      }
    : null

  useMountEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // the dock also closes on escape, so the area stops the key first
      event.stopPropagation()
      onCancel()
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  })

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = { x: event.clientX, y: event.clientY }
    setDrag({ start: point, end: point })
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return
    setDrag({ start: drag.start, end: { x: event.clientX, y: event.clientY } })
  }

  const handlePointerUp = () => {
    setDrag(null)
    // a click without a drag selects nothing, so it cancels
    if (!area || area.width < 8 || area.height < 8) {
      onCancel()
      return
    }
    onAreaSelect(area)
  }

  return createPortal(
    <div
      data-feedback-ui
      className="fixed inset-0 z-50 cursor-crosshair touch-none bg-background/40"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <p
        role="status"
        className={cn(
          'absolute left-1/2 top-16 -translate-x-1/2 rounded-md',
          'border border-default bg-200 px-2 py-1 text-xs text-foreground'
        )}
      >
        Drag over part of the page. Press Escape to cancel.
      </p>
      {area ? (
        <div
          className="absolute rounded-sm border border-dashed border-strong"
          style={{ left: area.left, top: area.top, width: area.width, height: area.height }}
        />
      ) : null}
    </div>,
    document.body
  )
}

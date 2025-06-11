import { MouseEvent, RefObject } from 'react'

import { cn } from 'ui'
import type { LayoutSpan } from '../utils/layout-algorithm'

interface MinimapProps {
  spans: LayoutSpan[]
  duration: number
  visiblePortionStart: number
  visiblePortionWidth: number
  onClick: (e: MouseEvent) => void
  minimapRef: RefObject<HTMLDivElement>
  spanAbsoluteRows: Record<string, number>
}

export function Minimap({
  spans,
  duration,
  visiblePortionStart,
  visiblePortionWidth,
  onClick,
  minimapRef,
  spanAbsoluteRows,
}: MinimapProps) {
  return (
    <div
      className="relative h-16 border-b border-neutral-800 bg-black px-4 cursor-pointer"
      ref={minimapRef}
      onClick={onClick}
    >
      <div className="absolute inset-0 mx-4 my-2">
        {/* Minimap spans - simplified representation */}
        {spans.map((span) => {
          const startPercent = (span.startTime / duration) * 100
          const widthPercent = Math.max(0.5, ((span.endTime - span.startTime) / duration) * 100)
          const row = spanAbsoluteRows[span.id]

          return (
            <div
              key={`minimap-${span.id}`}
              className={cn(
                'absolute h-1 bg-neutral-700',
                span.highlight ? 'bg-blue-700' : '',
                span.status === 'error' ? 'bg-red-900' : '',
                span.status === 'warning' ? 'bg-yellow-900' : ''
              )}
              style={{
                left: `${startPercent}%`,
                width: `${widthPercent}%`,
                top: `${row + 2}px`,
              }}
            />
          )
        })}

        {/* Viewport indicator - shows which part is currently visible */}
        <div
          className="absolute border border-neutral-400 bg-neutral-800 bg-opacity-20 h-full pointer-events-none"
          style={{
            left: `${visiblePortionStart}%`,
            width: `${visiblePortionWidth}%`,
          }}
        />
      </div>
    </div>
  )
}

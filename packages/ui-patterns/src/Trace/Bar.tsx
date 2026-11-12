'use client'

import type { ComponentProps } from 'react'
import { cn } from 'ui'

import { Duration, useSpan } from './Rows'
import { useTrace, useView } from './Trace'
import {
  collapsedChildMidpoints,
  effectiveEndMs,
  formatDuration,
  getSpanBounds,
  getTimingPlacement,
  STATUS_TEXT,
} from './utils'
import { LIVE_GROWTH_TRANSITION, useWaterfallScale } from './Waterfall'

const TIMING_GAP = 6
const TIMING_CHAR_PX = 7.2
const TIMING_CHIP_PX = 8

export function Bar({ className, style, ...props }: ComponentProps<'div'>) {
  const { row, isSelected } = useSpan()
  const { nowMs } = useTrace()
  const { isZoomed } = useView()
  const scale = useWaterfallScale()
  const { span } = row
  const { visibleStart, visibleEnd, isVisible } = getSpanBounds(span, nowMs, scale)
  if (!isVisible) return null

  return (
    <div
      data-trace-bar
      data-status={span.status}
      data-state={isSelected ? 'selected' : undefined}
      className={cn(
        'absolute top-1/2 h-[50%] min-w-0.5 -translate-y-1/2 rounded-sm bg-current',
        STATUS_TEXT[span.status],
        'data-[state=selected]:ring-1 data-[state=selected]:ring-inset data-[state=selected]:ring-foreground',
        !isZoomed && LIVE_GROWTH_TRANSITION,
        className
      )}
      style={{
        left: `min(${visibleStart * 100}%, calc(100% - 2px))`,
        width: `${(visibleEnd - visibleStart) * 100}%`,
        ...style,
      }}
      {...props}
    />
  )
}

export function Timing({ className, style, ...props }: ComponentProps<'div'>) {
  const { row } = useSpan()
  const { nowMs } = useTrace()
  const { isZoomed } = useView()
  const scale = useWaterfallScale()
  const { span } = row
  const { visibleStart, visibleEnd, isVisible } = getSpanBounds(span, nowMs, scale)
  if (!isVisible || scale.width === 0) return null

  const endMs = effectiveEndMs(span, nowMs)
  const startPx = visibleStart * scale.width
  const endPx = visibleEnd * scale.width
  const labelPx = formatDuration(endMs - span.startMs).length * TIMING_CHAR_PX + TIMING_CHIP_PX
  const placement = getTimingPlacement({
    startPx,
    endPx,
    laneWidth: scale.width,
    labelPx,
    gapPx: TIMING_GAP,
  })
  const fitsInBar = labelPx <= endPx - startPx

  const position = {
    after: { left: `calc(${visibleEnd * 100}% + ${TIMING_GAP}px)` },
    inside: {
      right: `min(calc(${(1 - visibleEnd) * 100}% + 4px), calc(100% - ${labelPx}px))`,
    },
    before: { right: `calc(${(1 - visibleStart) * 100}% + ${TIMING_GAP}px)` },
  }[placement]

  return (
    <div
      data-trace-timing
      data-placement={placement}
      className={cn(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm px-1',
        placement === 'inside' && fitsInBar && '[&>span]:text-background',
        placement === 'inside' && !fitsInBar && 'bg-background/90',
        !isZoomed && LIVE_GROWTH_TRANSITION,
        className
      )}
      style={{ ...position, ...style }}
      {...props}
    >
      <Duration />
    </div>
  )
}

export function Markers() {
  const { row } = useSpan()
  const scale = useWaterfallScale()

  return (
    <>
      {row.span.events.map((event, i) => {
        const fraction = scale.toFraction(event.timeMs)
        if (fraction < 0 || fraction > 1) return null
        return (
          <div
            key={i}
            aria-hidden
            data-trace-marker
            title={event.name}
            className="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-foreground bg-background"
            style={{ left: `${fraction * 100}%` }}
          />
        )
      })}
    </>
  )
}

export function CollapsedChildren() {
  const { row } = useSpan()
  const index = useTrace()
  const scale = useWaterfallScale()
  if (!row.hasChildren || row.isExpanded) return null

  return (
    <>
      {collapsedChildMidpoints(index, row.span.id)
        .map((ms) => scale.toFraction(ms))
        .filter((fraction) => fraction >= 0 && fraction <= 1)
        .map((fraction, i) => (
          <div
            key={i}
            aria-hidden
            data-trace-collapsed-mark
            className="pointer-events-none absolute top-1/2 h-[25%] w-px -translate-y-1/2 bg-background/70"
            style={{ left: `${fraction * 100}%` }}
          />
        ))}
    </>
  )
}

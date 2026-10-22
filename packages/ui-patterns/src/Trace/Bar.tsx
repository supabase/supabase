'use client'

import type { ComponentProps } from 'react'
import { Badge, cn } from 'ui'

import { Duration, useSpan } from './Rows'
import { useTrace, useView } from './Trace'
import type { SpanStatus } from './types'
import {
  collapsedChildMidpoints,
  effectiveEndMs,
  formatDuration,
  getTimingPlacement,
} from './utils'
import { useWaterfallScale } from './Waterfall'

const TIMING_GAP = 6
const TIMING_CHAR_PX = 7.2
const TIMING_CHIP_PX = 8
const SLOWEST_PX = 65

const STATUS_CLASS: Record<SpanStatus, string> = {
  ok: 'bg-brand',
  error: 'bg-destructive',
  unset: 'bg-foreground-muted',
}

export function Bar({ className, style, ...props }: ComponentProps<'div'>) {
  const { row, isSelected } = useSpan()
  const { nowMs } = useTrace()
  const { isZoomed } = useView()
  const scale = useWaterfallScale()
  const { span } = row
  const left = scale.toFraction(span.startMs)
  const width = scale.toFraction(effectiveEndMs(span, nowMs)) - left

  return (
    <div
      data-trace-bar
      data-status={span.status}
      data-state={isSelected ? 'selected' : undefined}
      className={cn(
        'absolute top-1/2 h-[50%] min-w-0.5 -translate-y-1/2 rounded-sm',
        STATUS_CLASS[span.status],
        isSelected && 'ring-1 ring-foreground',
        span.endMs === null &&
          !isZoomed &&
          'transition-[width] duration-300 ease-linear motion-reduce:transition-none',
        className
      )}
      style={{ left: `${left * 100}%`, width: `${width * 100}%`, ...style }}
      {...props}
    />
  )
}

export function Timing({ className, style, ...props }: ComponentProps<'div'>) {
  const { row } = useSpan()
  const { nowMs, slowestId } = useTrace()
  const { isZoomed } = useView()
  const scale = useWaterfallScale()
  const { span } = row
  const endMs = effectiveEndMs(span, nowMs)
  const startFraction = scale.toFraction(span.startMs)
  const endFraction = scale.toFraction(endMs)
  if (endFraction < 0 || startFraction > 1) return null

  const visibleStart = Math.max(startFraction, 0)
  const visibleEnd = Math.min(endFraction, 1)
  const labelPx = formatDuration(endMs - span.startMs).length * TIMING_CHAR_PX + TIMING_CHIP_PX
  const reserved = span.id === slowestId ? SLOWEST_PX : 0
  const placement = getTimingPlacement({
    startPx: visibleStart * scale.width,
    endPx: visibleEnd * scale.width,
    laneWidth: scale.width,
    labelPx,
    gapPx: TIMING_GAP,
  })

  const position = {
    after: { left: `calc(${visibleEnd * 100}% + ${TIMING_GAP}px)` },
    inside: { right: `calc(${(1 - visibleEnd) * 100}% + ${4 + reserved}px)` },
    before: { right: `calc(${(1 - visibleStart) * 100}% + ${TIMING_GAP}px)` },
  }[placement]

  return (
    <div
      data-trace-timing
      data-placement={placement}
      className={cn(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm px-1',
        placement === 'inside' && '[&>span]:text-background',
        placement === 'after' &&
          !isZoomed &&
          'transition-[left] duration-300 ease-linear motion-reduce:transition-none',
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

export function Slowest({ className, style, ...props }: ComponentProps<typeof Badge>) {
  const { row } = useSpan()
  const { nowMs, slowestId } = useTrace()
  const scale = useWaterfallScale()
  if (row.span.id !== slowestId) return null

  const endFraction = scale.toFraction(effectiveEndMs(row.span, nowMs))
  if (endFraction < 0 || scale.toFraction(row.span.startMs) > 1) return null

  return (
    <Badge
      variant="warning"
      data-trace-slowest
      className={cn(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 bg-background',
        className
      )}
      style={{ right: `calc(${(1 - Math.min(endFraction, 1)) * 100}% + 4px)`, ...style }}
      {...props}
    >
      Slowest
    </Badge>
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

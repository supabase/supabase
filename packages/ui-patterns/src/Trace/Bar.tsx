'use client'

import type { ComponentProps } from 'react'
import { Badge, cn } from 'ui'

import { useSpan } from './Rows'
import { useTrace } from './Trace'
import type { SpanStatus } from './types'
import { collapsedChildMidpoints, effectiveEndMs } from './utils'
import { useWaterfallScale } from './Waterfall'

const STATUS_CLASS: Record<SpanStatus, string> = {
  ok: 'bg-brand',
  error: 'bg-destructive',
  unset: 'bg-foreground-muted',
}

export function Bar({ className, style, ...props }: ComponentProps<'div'>) {
  const { row, isSelected } = useSpan()
  const { nowMs } = useTrace()
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
        'absolute top-1/2 h-[55%] min-w-0.5 -translate-y-1/2 rounded-sm',
        STATUS_CLASS[span.status],
        isSelected && 'ring-1 ring-foreground',
        span.endMs === null &&
          'transition-[width] duration-300 ease-linear motion-reduce:transition-none',
        className
      )}
      style={{ left: `${left * 100}%`, width: `${width * 100}%`, ...style }}
      {...props}
    />
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
            className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-foreground bg-background"
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

  return (
    <Badge
      variant="warning"
      data-trace-slowest
      className={cn(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 bg-background',
        className
      )}
      style={{ right: `calc(${(1 - endFraction) * 100}% + 4px)`, ...style }}
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
      {collapsedChildMidpoints(index, row.span.id).map((ms, i) => (
        <div
          key={i}
          aria-hidden
          data-trace-collapsed-mark
          className="pointer-events-none absolute top-1/2 h-[30%] w-px -translate-y-1/2 bg-background/70"
          style={{ left: `${scale.toFraction(ms) * 100}%` }}
        />
      ))}
    </>
  )
}

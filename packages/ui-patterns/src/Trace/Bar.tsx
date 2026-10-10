'use client'

import { CircleAlert } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useSpan } from './hooks/useSpan'
import { useData, useView } from './Trace'
import type { MarkerKind, SpanEvent } from './types'
import {
  computeBarGeometry,
  durationOf,
  effectiveEndMs,
  formatMs,
  inferMarkerKind,
  MARKER_KIND_LABEL,
} from './utils'

export function Bar({ className, style, children, ...props }: ComponentProps<'div'>) {
  const { span, state, isRunning } = useSpan()
  const { window } = useView()
  const { nowMs } = useData()

  const endMs = effectiveEndMs(span, isRunning ? Math.max(nowMs, window[1]) : nowMs)
  const geometry = computeBarGeometry(span.startMs, endMs, window)
  if (!geometry.isVisible) return null

  return (
    <div
      data-trace-bar
      data-state={state}
      data-status={span.status}
      data-service={span.serviceName}
      data-clip={geometry.clip}
      data-zero-duration={geometry.isZeroDuration ? '' : undefined}
      data-running={isRunning ? '' : undefined}
      className={cn(
        'absolute top-1/2 h-[55%] min-w-0.5 -translate-y-1/2 rounded-sm bg-current',
        'data-[status=ok]:text-brand data-[status=error]:text-destructive data-[status=unset]:text-foreground-muted',
        'transition-[opacity,box-shadow] motion-reduce:transition-none',
        'data-[state=hover]:brightness-110',
        'data-[state=selected]:ring-2 data-[state=selected]:ring-foreground data-[state=selected]:ring-offset-1 data-[state=selected]:ring-offset-background',
        'data-[state=dim]:opacity-40',
        'data-[clip=start]:rounded-l-none data-[clip=end]:rounded-r-none data-[clip=both]:rounded-none',
        'data-[zero-duration]:w-0.5',
        'data-[running]:bg-[repeating-linear-gradient(135deg,currentColor_0_6px,transparent_6px_10px)] data-[running]:motion-safe:animate-pulse',
        className
      )}
      style={{
        left: `${geometry.leftFraction * 100}%`,
        width: geometry.isZeroDuration ? undefined : `${geometry.widthFraction * 100}%`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

interface MarkerProps {
  event: SpanEvent
  kind: MarkerKind
  offsetMs: number
}

function Marker({ event, kind, offsetMs }: MarkerProps) {
  const { window, bounds } = useView()
  const duration = window[1] - window[0]
  if (!(duration > 0)) return null
  const fraction = (event.timeMs - window[0]) / duration
  if (fraction < 0 || fraction > 1) return null

  const kindLabel = MARKER_KIND_LABEL[kind]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={-1}
          aria-label={`${kindLabel} at ${formatMs(event.timeMs - bounds[0])}`}
          data-trace-marker
          data-kind={kind}
          className="absolute top-1/2 flex size-3 -translate-x-1/2 -translate-y-1/2 items-center justify-center focus-ring"
          style={{ left: `${fraction * 100}%` }}
          onClick={(e) => e.stopPropagation()}
        >
          {kind === 'exception' && <CircleAlert className="size-2.5 text-destructive" />}
          {kind === 'log' && <span aria-hidden className="size-1.5 rounded-full bg-black/50" />}
          {kind === 'milestone' && <span aria-hidden className="size-1.5 rotate-45 bg-black/50" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {event.name}
        <span className="text-foreground-light"> · +{formatMs(offsetMs)}</span>
      </TooltipContent>
    </Tooltip>
  )
}

export function Markers() {
  const { span } = useSpan()
  if (span.events.length === 0) return null

  return (
    <>
      {span.events.map((event, index) => (
        <Marker
          key={`${event.timeMs}-${event.name}-${index}`}
          event={event}
          kind={inferMarkerKind(event)}
          offsetMs={event.timeMs - span.startMs}
        />
      ))}
    </>
  )
}

export function Duration({ className, ...props }: ComponentProps<'span'>) {
  const { span, isRunning } = useSpan()
  const { nowMs } = useData()
  const duration = formatMs(durationOf(span, nowMs))

  return (
    <span
      data-trace-duration
      className={cn(
        'shrink-0 font-mono text-xs tabular-nums text-foreground-lighter tracking-wide',
        isRunning && 'text-foreground-light',
        className
      )}
      {...props}
    >
      {isRunning ? `${duration}…` : duration}
    </span>
  )
}

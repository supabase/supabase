'use client'

import type { ComponentProps, KeyboardEvent, PointerEvent } from 'react'
import { useMemo, useRef } from 'react'
import { cn } from 'ui'

import { useTrace, useView } from './Trace'
import type { SpanStatus, TimeWindow } from './types'
import {
  clampWindow,
  computeMinimapRects,
  formatDuration,
  MINIMAP_COLUMNS,
  resizeWindow,
} from './utils'

const STATUS_FILL: Record<SpanStatus, string> = {
  ok: 'fill-brand',
  error: 'fill-destructive',
  unset: 'fill-foreground-muted',
}
const HEIGHT = 48
const MIN_LANE = 2
const MAX_LANE = 10
const EDGE_PX = 8
const KEY_STEP = 0.1

interface Drag {
  mode: 'move' | 'start' | 'end'
  originX: number
  originWindow: TimeWindow
  width: number
}

export function Minimap({ className, ...props }: ComponentProps<'div'>) {
  const index = useTrace()
  const { window, setWindow } = useView()
  const drag = useRef<Drag | null>(null)
  const [boundsStart, boundsEnd] = index.bounds
  const duration = boundsEnd - boundsStart

  const { rects, laneCount } = useMemo(
    () => computeMinimapRects(index, MINIMAP_COLUMNS, Math.floor(HEIGHT / MIN_LANE)),
    [index]
  )
  const lanePitch = Math.min(MAX_LANE, Math.max(MIN_LANE, HEIGHT / Math.max(1, laneCount)))
  const laneGap = Math.min(2, lanePitch * 0.25)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !(duration > 0)) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const ms = boundsStart + (x / rect.width) * duration
    const toPx = (value: number) => ((value - boundsStart) / duration) * rect.width
    const edgeZone = Math.min(EDGE_PX, (toPx(window[1]) - toPx(window[0])) / 3)
    const startDistance = Math.abs(x - toPx(window[0]))
    const endDistance = Math.abs(x - toPx(window[1]))

    let mode: Drag['mode'] = 'move'
    let originWindow = window
    if (Math.min(startDistance, endDistance) <= edgeZone) {
      mode = startDistance <= endDistance ? 'start' : 'end'
    } else if (ms < window[0] || ms > window[1]) {
      const half = (window[1] - window[0]) / 2
      originWindow = clampWindow([ms - half, ms + half], index.bounds)
      setWindow(originWindow[0], originWindow[1])
    }

    drag.current = { mode, originX: event.clientX, originWindow, width: rect.width }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state) return
    const deltaMs = ((event.clientX - state.originX) / state.width) * duration
    const [start, end] = state.originWindow
    if (state.mode === 'move') {
      setWindow(start + deltaMs, end + deltaMs)
      return
    }
    const edgeMs = (state.mode === 'start' ? start : end) + deltaMs
    const next = resizeWindow(state.originWindow, state.mode, edgeMs, index.bounds)
    setWindow(next[0], next[1])
  }

  const endDrag = () => {
    drag.current = null
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const step = (event.key === 'ArrowRight' ? 1 : -1) * (window[1] - window[0]) * KEY_STEP
    if (event.shiftKey) {
      const next = resizeWindow(window, 'end', window[1] + step, index.bounds)
      setWindow(next[0], next[1])
    } else {
      setWindow(window[0] + step, window[1] + step)
    }
  }

  const left = duration > 0 ? ((window[0] - boundsStart) / duration) * 100 : 0
  const right = duration > 0 ? ((boundsEnd - window[1]) / duration) * 100 : 0

  return (
    <div
      data-trace-minimap
      className={cn(
        'relative h-12 shrink-0 touch-none select-none overflow-hidden border-b border-default bg-surface-100',
        className
      )}
      {...props}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <svg
        aria-hidden
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${MINIMAP_COLUMNS} ${HEIGHT}`}
        preserveAspectRatio="none"
      >
        {rects.map(({ lane, x, width, status }) => (
          <rect
            key={`${lane}-${x}`}
            x={x}
            y={lane * lanePitch + laneGap / 2}
            width={width}
            height={lanePitch - laneGap}
            className={cn('opacity-70', STATUS_FILL[status])}
          />
        ))}
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 bg-background/60"
        style={{ width: `${left}%` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 bg-background/60"
        style={{ width: `${right}%` }}
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Visible time window"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={window[0] - boundsStart}
        aria-valuetext={`${formatDuration(window[0] - boundsStart)} to ${formatDuration(window[1] - boundsStart)}`}
        data-trace-brush
        className="absolute inset-y-0 cursor-grab bg-brand/5 outline-none ring-2 ring-inset ring-brand focus-visible:ring-foreground active:cursor-grabbing active:bg-brand/10"
        style={{ left: `${left}%`, right: `${right}%` }}
        onKeyDown={handleKeyDown}
      >
        <div aria-hidden className="absolute inset-y-0 -left-1 w-2 cursor-ew-resize">
          <span className="absolute inset-y-[25%] left-[3px] w-0.5 rounded bg-foreground" />
        </div>
        <div aria-hidden className="absolute inset-y-0 -right-1 w-2 cursor-ew-resize">
          <span className="absolute inset-y-[25%] right-[3px] w-0.5 rounded bg-foreground" />
        </div>
      </div>
    </div>
  )
}

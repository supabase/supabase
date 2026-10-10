'use client'

import type { ComponentProps } from 'react'
import { useMemo } from 'react'
import { cn } from 'ui'

import { useBrush } from './hooks/useBrush'
import { useTimeScale } from './hooks/useTimeScale'
import { useData, useView } from './Trace'
import type { SpanStatus, TimeWindow } from './types'
import { effectiveEndMs, formatMs, msToFraction } from './utils'

export interface MinimapProps extends ComponentProps<'div'> {
  height?: number
  maxDetailSpans?: number
  laneHeight?: number
}

const VIEWBOX_WIDTH = 1000
const MIN_LANE_HEIGHT = 2
const MAX_LANE_HEIGHT = 10

interface DensityBucket {
  x: number
  total: number
  errors: number
}

interface MinimapItem {
  id: string
  startMs: number
  endMs: number
  status: SpanStatus
  depth: number
}

function computeDensity(
  items: readonly MinimapItem[],
  bounds: TimeWindow,
  bucketCount: number
): DensityBucket[] {
  const duration = bounds[1] - bounds[0]
  if (!(duration > 0) || bucketCount <= 0) return []
  const total = new Array<number>(bucketCount + 1).fill(0)
  const errors = new Array<number>(bucketCount + 1).fill(0)
  for (const item of items) {
    const from = Math.max(0, Math.floor(((item.startMs - bounds[0]) / duration) * bucketCount))
    const to = Math.min(
      bucketCount - 1,
      Math.max(from, Math.ceil(((item.endMs - bounds[0]) / duration) * bucketCount) - 1)
    )
    total[from] += 1
    total[to + 1] -= 1
    if (item.status === 'error') {
      errors[from] += 1
      errors[to + 1] -= 1
    }
  }
  const buckets: DensityBucket[] = []
  let runningTotal = 0
  let runningErrors = 0
  for (let i = 0; i < bucketCount; i++) {
    runningTotal += total[i]
    runningErrors += errors[i]
    buckets.push({ x: i / bucketCount, total: runningTotal, errors: runningErrors })
  }
  return buckets
}

const STATUS_FILL: Record<SpanStatus, string> = {
  ok: 'fill-brand',
  error: 'fill-destructive',
  unset: 'fill-foreground-muted',
}

export function Minimap({
  height = 48,
  maxDetailSpans = 2000,
  laneHeight: laneHeightProp,
  className,
  ...props
}: MinimapProps) {
  const index = useData()
  const { window, bounds, dispatch } = useView()
  const { ref, width } = useTimeScale<HTMLDivElement>()
  const brush = useBrush({
    bounds,
    window,
    width,
    onWindowChange: (next) => dispatch({ type: 'setWindow', window: next }),
    onReset: () => dispatch({ type: 'setWindow', window: null }),
  })

  const isDetail = index.byId.size <= maxDetailSpans
  const depthCount = Math.max(1, ...Array.from(index.depthOf.values())) + 1
  const laneHeight =
    laneHeightProp ?? Math.min(MAX_LANE_HEIGHT, Math.max(MIN_LANE_HEIGHT, height / depthCount))
  const maxLanes = Math.max(1, Math.floor(height / laneHeight))

  const shapes = useMemo(() => {
    const items: MinimapItem[] = Array.from(index.byId.values()).map((span) => ({
      id: span.id,
      startMs: span.startMs,
      endMs: effectiveEndMs(span, index.nowMs),
      status: span.status,
      depth: index.depthOf.get(span.id) ?? 0,
    }))
    if (isDetail) return { kind: 'detail' as const, items }
    const bucketCount = Math.max(50, Math.min(400, Math.floor(width / 2) || 200))
    return { kind: 'density' as const, buckets: computeDensity(items, bounds, bucketCount) }
  }, [index, isDetail, bounds, width])

  const maxDensity =
    shapes.kind === 'density' ? Math.max(1, ...shapes.buckets.map((bucket) => bucket.total)) : 1

  const leftShade = msToFraction(window[0], bounds)
  const rightShade = 1 - msToFraction(window[1], bounds)

  return (
    <div
      data-trace-minimap
      data-mode={shapes.kind}
      className={cn(
        'relative w-full select-none overflow-hidden rounded-md border border-default bg-surface-100',
        className
      )}
      style={{ height }}
      {...props}
    >
      <svg
        aria-hidden
        className="absolute inset-0 size-full"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`}
        preserveAspectRatio="none"
      >
        {shapes.kind === 'detail' &&
          shapes.items.map((item) => {
            const x = msToFraction(item.startMs, bounds) * VIEWBOX_WIDTH
            const w = Math.max(1, msToFraction(item.endMs, bounds) * VIEWBOX_WIDTH - x)
            const lane = Math.min(item.depth, maxLanes - 1)
            return (
              <rect
                key={item.id}
                x={x}
                y={lane * laneHeight}
                width={w}
                height={Math.max(1, laneHeight - Math.min(2, laneHeight * 0.25))}
                className={cn('opacity-70', STATUS_FILL[item.status])}
              />
            )
          })}
        {shapes.kind === 'density' &&
          shapes.buckets.map((bucket) => {
            const barHeight = (bucket.total / maxDensity) * height
            const errorHeight = (bucket.errors / maxDensity) * height
            const barWidth = VIEWBOX_WIDTH / shapes.buckets.length
            return (
              <g key={bucket.x}>
                <rect
                  x={bucket.x * VIEWBOX_WIDTH}
                  y={height - barHeight}
                  width={barWidth}
                  height={barHeight}
                  className="fill-foreground-muted opacity-40"
                />
                {errorHeight > 0 && (
                  <rect
                    x={bucket.x * VIEWBOX_WIDTH}
                    y={height - errorHeight}
                    width={barWidth}
                    height={errorHeight}
                    className="fill-destructive opacity-60"
                  />
                )}
              </g>
            )
          })}
      </svg>

      <div
        ref={ref}
        data-trace-brush-track
        className="absolute inset-0 cursor-crosshair"
        {...brush.getTrackProps()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 bg-background/60"
          style={{ width: `${leftShade * 100}%` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 bg-background/60"
          style={{ width: `${rightShade * 100}%` }}
        />
        <div
          role="group"
          aria-label="Visible time window"
          data-trace-brush
          data-dragging={brush.isDragging ? '' : undefined}
          data-full={brush.isFull ? '' : undefined}
          className={cn(
            'absolute inset-y-0 cursor-grab rounded-sm bg-brand/5 ring-2 ring-inset ring-brand focus-inset',
            'data-[dragging]:cursor-grabbing data-[dragging]:bg-brand/10'
          )}
          style={{ left: brush.rect.left, width: brush.rect.width }}
          {...brush.getBrushProps()}
        >
          <div
            aria-label="Window start"
            aria-valuetext={formatMs(window[0] - bounds[0])}
            data-trace-brush-handle="start"
            className="absolute inset-y-0 -left-1 w-2 cursor-ew-resize focus-ring"
            {...brush.getHandleProps('start')}
          >
            <span className="absolute inset-y-[25%] left-[3px] w-0.5 rounded bg-foreground" />
          </div>
          <div
            aria-label="Window end"
            aria-valuetext={formatMs(window[1] - bounds[0])}
            data-trace-brush-handle="end"
            className="absolute inset-y-0 -right-1 w-2 cursor-ew-resize focus-ring"
            {...brush.getHandleProps('end')}
          >
            <span className="absolute inset-y-[25%] right-[3px] w-0.5 rounded bg-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}

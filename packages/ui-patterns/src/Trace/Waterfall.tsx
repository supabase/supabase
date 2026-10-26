'use client'

import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentProps, CSSProperties } from 'react'
import { cn } from 'ui'

import { useTrace } from './Trace'
import type { TimeScale, WaterfallProps } from './types'
import { createTimeScale } from './utils'

const LIVE_GROWTH_TRANSITION =
  'transition-[left] duration-300 ease-linear motion-reduce:transition-none'

const WaterfallContext = createContext<TimeScale | null>(null)

export function useWaterfallScale(): TimeScale {
  const value = use(WaterfallContext)
  if (!value) throw new Error('Trace parts must be rendered inside Trace.Waterfall')
  return value
}

export function Waterfall({
  treeWidth = 320,
  className,
  style,
  children,
  ...props
}: WaterfallProps) {
  const { bounds } = useTrace()
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const ref = useCallback((node: HTMLDivElement | null) => setElement(node), [])

  useEffect(() => {
    if (!element) return
    const measure = () => {
      const rect = element.getBoundingClientRect()
      setWidth(rect.width)
      setHeight(rect.height)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  const [start, end] = bounds
  const scale = useMemo(
    () => createTimeScale([start, end], Math.max(0, width - treeWidth)),
    [start, end, width, treeWidth]
  )

  return (
    <WaterfallContext.Provider value={scale}>
      <div
        ref={ref}
        data-trace-waterfall
        className={cn(
          'flex min-h-0 flex-col overflow-hidden bg-surface-100 text-sm text-foreground',
          className
        )}
        style={
          {
            '--trace-tree-width': `${treeWidth}px`,
            '--trace-ruler-height': '28px',
            '--trace-waterfall-height': `${height}px`,
            ...style,
          } as CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </WaterfallContext.Provider>
  )
}

export function Ruler({ className, children, ...props }: ComponentProps<'div'>) {
  const scale = useWaterfallScale()

  return (
    <div
      data-trace-ruler
      className={cn(
        'flex h-(--trace-ruler-height) shrink-0 divide-x divide-default border-b border-default bg-surface-200',
        className
      )}
      {...props}
    >
      <div
        data-trace-ruler-label
        className="flex w-(--trace-tree-width) shrink-0 select-none items-center justify-between px-3"
      >
        <span className="text-xs uppercase tracking-wider text-foreground-muted">Span</span>
        <div data-trace-controls className="flex shrink-0 flex-nowrap items-center gap-0.5">
          {children}
        </div>
      </div>
      <div aria-hidden className="relative min-w-0 flex-1 select-none overflow-hidden">
        {scale.ticks.map((tick) => (
          <div
            key={tick.ms}
            data-trace-tick
            className={cn(
              'absolute inset-y-0',
              tick.fraction > 0 && 'border-l border-strong',
              LIVE_GROWTH_TRANSITION
            )}
            style={{ left: `${tick.fraction * 100}%` }}
          >
            <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-xs tabular-nums text-foreground-muted">
              {tick.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Grid({ className, ...props }: ComponentProps<'div'>) {
  const scale = useWaterfallScale()

  return (
    <div data-trace-grid-anchor className="relative z-0 h-0 shrink-0">
      <div
        aria-hidden
        data-trace-grid
        className={cn(
          'pointer-events-none absolute left-(--trace-tree-width) right-0 top-0 h-(--trace-waterfall-height) overflow-hidden',
          className
        )}
        {...props}
      >
        {scale.ticks.map((tick) =>
          tick.fraction > 0 ? (
            <div
              key={tick.ms}
              data-trace-gridline
              className={cn('absolute inset-y-0 border-l border-muted', LIVE_GROWTH_TRANSITION)}
              style={{ left: `${tick.fraction * 100}%` }}
            />
          ) : null
        )}
      </div>
    </div>
  )
}

export function Cursor({ className, ...props }: ComponentProps<'div'>) {
  const scale = useWaterfallScale()
  const { isLive, nowMs } = useTrace()
  const fraction = scale.toFraction(nowMs)
  if (!isLive || fraction < 0 || fraction > 1) return null

  return (
    <div data-trace-cursor-anchor className="relative z-10 h-0 shrink-0">
      <div
        aria-hidden
        data-trace-cursor-track
        className={cn(
          'pointer-events-none absolute left-(--trace-tree-width) right-0 top-[calc(var(--trace-ruler-height)*-1)] h-(--trace-waterfall-height) overflow-hidden',
          className
        )}
        {...props}
      >
        <div
          data-trace-cursor
          className={cn('absolute inset-y-0 border-l border-brand', LIVE_GROWTH_TRANSITION)}
          style={{ left: `${fraction * 100}%` }}
        >
          <span className="absolute -left-[0.5px] top-(--trace-ruler-height) size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" />
        </div>
      </div>
    </div>
  )
}

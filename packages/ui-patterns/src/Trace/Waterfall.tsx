'use client'

import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentProps, CSSProperties } from 'react'
import { cn } from 'ui'

import { useTrace } from './Trace'
import type { TimeScale, WaterfallProps } from './types'
import { createTimeScale } from './utils'

const WaterfallContext = createContext<TimeScale | null>(null)

function useWaterfallScale(): TimeScale {
  const value = use(WaterfallContext)
  if (!value) throw new Error('Trace.Ruler must be rendered inside Trace.Waterfall')
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
  const ref = useCallback((node: HTMLDivElement | null) => setElement(node), [])

  useEffect(() => {
    if (!element) return
    const measure = () => setWidth(element.getBoundingClientRect().width)
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
        style={{ '--trace-tree-width': `${treeWidth}px`, ...style } as CSSProperties}
        {...props}
      >
        {children}
      </div>
    </WaterfallContext.Provider>
  )
}

export function Ruler({ className, ...props }: ComponentProps<'div'>) {
  const scale = useWaterfallScale()
  const { isLive, nowMs } = useTrace()
  const nowFraction = scale.toFraction(nowMs)
  const showNow = isLive && nowFraction >= 0 && nowFraction <= 1

  return (
    <div
      data-trace-ruler
      className={cn('flex h-7 shrink-0 border-b border-default bg-surface-200', className)}
      {...props}
    >
      <div className="w-(--trace-tree-width) shrink-0" />
      <div aria-hidden className="relative min-w-0 flex-1 select-none overflow-hidden">
        {scale.ticks.map((tick) => (
          <div
            key={tick.ms}
            data-trace-tick
            className="absolute inset-y-0 border-l border-strong transition-[left] duration-300 ease-linear motion-reduce:transition-none"
            style={{ left: `${tick.fraction * 100}%` }}
          >
            <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-xs tabular-nums text-foreground-muted">
              {tick.label}
            </span>
          </div>
        ))}
        {showNow && (
          <div
            data-trace-now
            className="absolute inset-y-0 border-l border-brand transition-[left] duration-300 ease-linear motion-reduce:transition-none"
            style={{ left: `${nowFraction * 100}%` }}
          >
            <span className="absolute left-0 top-0 size-1.5 -translate-x-1/2 rounded-full bg-brand" />
          </div>
        )}
      </div>
    </div>
  )
}

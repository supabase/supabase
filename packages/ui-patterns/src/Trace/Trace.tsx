'use client'

import { createContext, use, useCallback, useMemo, useState } from 'react'

import type { RootProps, TimeWindow, TraceIndex, ViewContextValue } from './types'
import { buildTraceIndex, clampWindow } from './utils'

const TraceContext = createContext<TraceIndex | null>(null)
const ViewContext = createContext<ViewContextValue | null>(null)

export function Root({ trace, minRangeMs, defaultCollapsed, children }: RootProps) {
  const index = useMemo(
    () => buildTraceIndex(trace.spans, trace.nowMs, minRangeMs),
    [trace.spans, trace.nowMs, minRangeMs]
  )
  const [selectedId, select] = useState<string | null>(null)
  const [collapsed, setCollapsedIds] = useState<ReadonlySet<string>>(
    () => defaultCollapsed ?? new Set()
  )

  const setCollapsed = useCallback((id: string, isCollapsed: boolean) => {
    setCollapsedIds((previous) => {
      if (previous.has(id) === isCollapsed) return previous
      const next = new Set(previous)
      if (isCollapsed) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const { bounds } = index
  const [zoom, setZoom] = useState<TimeWindow | null>(null)
  const window = useMemo(() => (zoom ? clampWindow(zoom, bounds) : bounds), [zoom, bounds])
  const setWindow = useCallback(
    (start: number, end: number) => setZoom(clampWindow([start, end], bounds)),
    [bounds]
  )
  const resetWindow = useCallback(() => setZoom(null), [])

  const view = useMemo<ViewContextValue>(
    () => ({
      selectedId,
      collapsed,
      window,
      isZoomed: zoom !== null,
      select,
      setCollapsed,
      setWindow,
      resetWindow,
    }),
    [selectedId, collapsed, window, zoom, setCollapsed, setWindow, resetWindow]
  )

  return (
    <TraceContext.Provider value={index}>
      <ViewContext.Provider value={view}>{children}</ViewContext.Provider>
    </TraceContext.Provider>
  )
}

export function useTrace(): TraceIndex {
  const value = use(TraceContext)
  if (!value) throw new Error('Trace parts must be rendered inside Trace.Root')
  return value
}

export function useView(): ViewContextValue {
  const value = use(ViewContext)
  if (!value) throw new Error('Trace parts must be rendered inside Trace.Root')
  return value
}

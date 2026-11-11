'use client'

import { createContext, use, useCallback, useMemo, useState } from 'react'

import type { RootProps, TraceIndex, ViewContextValue } from './types'
import { buildTraceIndex } from './utils'

const TraceContext = createContext<TraceIndex | null>(null)
const ViewContext = createContext<ViewContextValue | null>(null)

export function Root({ trace, minRangeMs, children }: RootProps) {
  const index = useMemo(
    () => buildTraceIndex(trace.spans, trace.nowMs, minRangeMs),
    [trace.spans, trace.nowMs, minRangeMs]
  )
  const [selectedId, select] = useState<string | null>(null)
  const [collapsed, setCollapsedIds] = useState<ReadonlySet<string>>(() => new Set())

  const setCollapsed = useCallback((id: string, isCollapsed: boolean) => {
    setCollapsedIds((previous) => {
      if (previous.has(id) === isCollapsed) return previous
      const next = new Set(previous)
      if (isCollapsed) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const view = useMemo<ViewContextValue>(
    () => ({ selectedId, collapsed, select, setCollapsed }),
    [selectedId, collapsed, setCollapsed]
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

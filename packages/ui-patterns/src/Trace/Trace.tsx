'use client'

import { createContext, use, useMemo } from 'react'

import type { RootProps, TraceIndex } from './types'
import { buildTraceIndex } from './utils'

const TraceContext = createContext<TraceIndex | null>(null)

export function Root({ trace, minRangeMs, children }: RootProps) {
  const index = useMemo(
    () => buildTraceIndex(trace.spans, trace.nowMs, minRangeMs),
    [trace.spans, trace.nowMs, minRangeMs]
  )

  return <TraceContext.Provider value={index}>{children}</TraceContext.Provider>
}

export function useTrace(): TraceIndex {
  const value = use(TraceContext)
  if (!value) throw new Error('Trace parts must be rendered inside Trace.Root')
  return value
}

import type { ReactNode } from 'react'

export type SpanStatus = 'ok' | 'error' | 'unset'

export interface SpanEvent {
  timeMs: number
  name: string
  attributes?: Record<string, unknown>
}

export interface Span {
  id: string
  parentId: string | null
  traceId: string
  name: string
  startMs: number
  endMs: number | null
  status: SpanStatus
  attributes: Record<string, unknown>
  events: SpanEvent[]
}

export interface TraceData {
  traceId?: string
  spans: readonly Span[]
  nowMs?: number
}

export type TimeWindow = readonly [start: number, end: number]

export interface TraceIndex {
  spans: readonly Span[]
  byId: ReadonlyMap<string, Span>
  childrenOf: ReadonlyMap<string, readonly string[]>
  roots: readonly string[]
  bounds: TimeWindow
  nowMs: number
  isLive: boolean
  slowestId: string | null
}

export interface TimeScale {
  window: TimeWindow
  width: number
  durationMs: number
  toFraction: (ms: number) => number
  toX: (ms: number) => number
  toMs: (x: number) => number
}

export interface RootProps {
  trace: TraceData
  minRangeMs?: number
  children?: ReactNode
}

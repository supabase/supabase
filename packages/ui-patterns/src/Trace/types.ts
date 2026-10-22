import type { ComponentProps, ReactNode } from 'react'

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

export interface TimeTick {
  ms: number
  fraction: number
  label: string
}

export interface TimeScale {
  window: TimeWindow
  width: number
  durationMs: number
  ticks: readonly TimeTick[]
  toFraction: (ms: number) => number
  toX: (ms: number) => number
  toMs: (x: number) => number
}

export interface RootProps {
  trace: TraceData
  minRangeMs?: number
  children?: ReactNode
}

export interface WaterfallProps extends ComponentProps<'div'> {
  treeWidth?: number
}

export interface VisibleRow {
  span: Span
  depth: number
  hasChildren: boolean
  isExpanded: boolean
}

export interface ViewContextValue {
  selectedId: string | null
  collapsed: ReadonlySet<string>
  select: (id: string | null) => void
  setCollapsed: (id: string, collapsed: boolean) => void
}

export interface SpanContextValue {
  row: VisibleRow
  isSelected: boolean
}

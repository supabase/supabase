import type { Dispatch, ReactNode } from 'react'

export type SpanStatus = 'ok' | 'error' | 'unset'

export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer' | (string & {})

export interface SpanEvent {
  timeMs: number
  name: string
  attributes?: Record<string, unknown>
}

export interface SpanLink {
  traceId: string
  spanId: string
}

export interface Span {
  id: string
  parentId: string | null
  traceId: string
  name: string
  serviceName: string
  kind: SpanKind
  startMs: number
  endMs: number | null
  status: SpanStatus
  attributes: Record<string, unknown>
  events: SpanEvent[]
  links: SpanLink[]
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
  orphanIds: ReadonlySet<string>
  depthOf: ReadonlyMap<string, number>
  descendantCountOf: ReadonlyMap<string, number>
  bounds: TimeWindow
  nowMs: number
  serviceNames: readonly string[]
}

export type FilterMatch = 'inactive' | 'match' | 'ancestor'

export interface VisibleRow {
  id: string
  span: Span
  index: number
  depth: number
  parentId: string | null
  hasChildren: boolean
  isExpanded: boolean
  hiddenDescendantCount: number
  isOrphan: boolean
  siblingIndex: number
  siblingCount: number
  guides: readonly boolean[]
  filterMatch: FilterMatch
}

export interface TimeTick {
  ms: number
  fraction: number
  x: number
  label: string
}

export interface TimeScale {
  window: TimeWindow
  origin: number
  width: number
  durationMs: number
  pxPerMs: number
  stepMs: number
  ticks: readonly TimeTick[]
  toFraction: (ms: number) => number
  toX: (ms: number) => number
  toMs: (x: number) => number
  format: (ms: number) => string
}

export interface TimeScaleOptions {
  window: TimeWindow
  width: number
  origin?: number
  targetTickSpacing?: number
}

export type BarState = 'default' | 'hover' | 'selected' | 'dim' | 'running'

export type BarClip = 'none' | 'start' | 'end' | 'both'

export interface BarGeometry {
  isVisible: boolean
  isZeroDuration: boolean
  clip: BarClip
  leftFraction: number
  widthFraction: number
}

export type MarkerKind = 'log' | 'exception' | 'milestone'

export type ValueKind = 'string' | 'number' | 'boolean' | 'null' | 'id' | 'url' | 'error' | 'json'

export type KeyboardAction =
  | { type: 'select'; id: string }
  | { type: 'expand'; id: string }
  | { type: 'collapse'; id: string }

export type BrushEdge = 'start' | 'end'

export type BrushMode = 'idle' | 'create' | 'move' | 'resize-start' | 'resize-end'

export interface BrushRect {
  left: number
  width: number
}

export interface FilterTerm {
  key: string | null
  value: string
  negate: boolean
}

export interface ViewState {
  window: TimeWindow | null
  selectedId: string | null
  hoveredId: string | null
  collapsed: ReadonlySet<string>
  query: string
}

export type ViewAction =
  | { type: 'setWindow'; window: TimeWindow | null }
  | { type: 'select'; id: string | null }
  | { type: 'hover'; id: string | null }
  | { type: 'toggle'; id: string }
  | { type: 'expand'; id: string }
  | { type: 'collapse'; id: string }
  | { type: 'collapseAll' }
  | { type: 'expandAll' }
  | { type: 'setCollapsed'; collapsed: ReadonlySet<string> }
  | { type: 'setQuery'; query: string }

export type DataContextValue = TraceIndex

export interface ViewContextValue {
  window: TimeWindow
  bounds: TimeWindow
  isReset: boolean
  selectedId: string | null
  hoveredId: string | null
  collapsed: ReadonlySet<string>
  query: string
  matchIds: ReadonlySet<string> | null
  dispatch: Dispatch<ViewAction>
}

export interface SpanContextValue {
  span: Span
  row: VisibleRow
  isSelected: boolean
  isHovered: boolean
  isRunning: boolean
  state: BarState
  readOnly: boolean
}

export interface RootProps {
  trace: TraceData
  selectedId?: string | null
  onSelectedIdChange?: (id: string | null) => void
  window?: TimeWindow
  onWindowChange?: (window: TimeWindow) => void
  defaultCollapsed?: ReadonlySet<string>
  defaultQuery?: string
  children?: ReactNode
}

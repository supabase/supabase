import { Bar, Duration, Markers } from './Bar'
import { Cell } from './Cell'
import { CollapseAll, Filter, Header, ResetZoom, Status, Title } from './Header'
import { Inspector } from './Inspector'
import { Minimap } from './Minimap'
import { Root } from './Trace'
import { Lane, Rows, Ruler, Waterfall } from './Waterfall'

export const Trace = {
  Root,
  Header,
  Title,
  Status,
  Filter,
  CollapseAll,
  ResetZoom,
  Minimap,
  Waterfall,
  Ruler,
  Rows,
  Cell,
  Lane,
  Bar,
  Markers,
  Duration,
  Inspector,
}

export { useSpan } from './hooks/useSpan'
export { useTimeScale } from './hooks/useTimeScale'

export type {
  BarState,
  MarkerKind,
  RootProps,
  Span,
  SpanContextValue,
  SpanEvent,
  SpanKind,
  SpanLink,
  SpanStatus,
  TimeScale,
  TimeTick,
  TimeWindow,
  TraceData,
  ViewAction,
  ViewContextValue,
  VisibleRow,
} from './types'

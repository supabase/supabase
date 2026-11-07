import { Bar, CollapsedChildren, Markers, Slowest, Timing } from './Bar'
import { CollapseAll, Header, ResetZoom, Status, Title } from './Header'
import { Inspector } from './Inspector'
import { Minimap } from './Minimap'
import { Cell, Duration, Lane, Rows } from './Rows'
import { Root } from './Trace'
import { Cursor, Grid, Ruler, Waterfall } from './Waterfall'

export const Trace = {
  Root,
  Waterfall,
  Ruler,
  Grid,
  Cursor,
  Rows,
  Cell,
  Lane,
  Duration,
  Bar,
  Markers,
  Slowest,
  Timing,
  CollapsedChildren,
  Minimap,
  Inspector,
  Header,
  Title,
  Status,
  CollapseAll,
  ResetZoom,
}

export { useView } from './Trace'

export type {
  RootProps,
  Span,
  SpanEvent,
  SpanStatus,
  TimeScale,
  TimeTick,
  TimeWindow,
  TraceData,
  TraceIndex,
  ViewContextValue,
  VisibleRow,
  WaterfallProps,
} from './types'

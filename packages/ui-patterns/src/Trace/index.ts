import { Bar, CollapsedChildren, Markers, Slowest } from './Bar'
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
  CollapsedChildren,
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

import { Root } from './Trace'
import { Cursor, Grid, Ruler, Waterfall } from './Waterfall'

export const Trace = { Root, Waterfall, Ruler, Grid, Cursor }

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
  WaterfallProps,
} from './types'

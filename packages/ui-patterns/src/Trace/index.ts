import { Root } from './Trace'
import { Ruler, Waterfall } from './Waterfall'

export const Trace = { Root, Waterfall, Ruler }

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

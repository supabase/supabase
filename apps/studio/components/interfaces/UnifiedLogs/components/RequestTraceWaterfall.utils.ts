import type { Span, SpanStatus, TraceData } from 'ui-patterns/Trace'

import type { TraceSpan, UnifiedLogTraceSpansData } from '@/data/logs/unified-log-trace-spans-query'

function toSpanStatus(statusCode: string): SpanStatus {
  if (statusCode === 'error') return 'error'
  if (statusCode === 'ok') return 'ok'
  return 'unset'
}

function toSpan(span: TraceSpan, traceId: string): Span {
  const { attributes } = span
  const startMs = Date.parse(attributes.start_time)
  return {
    id: span.id,
    parentId: attributes.parent_span_id,
    traceId,
    name: attributes.span_name,
    startMs,
    endMs: startMs + attributes.duration_ns / 1_000_000,
    status: toSpanStatus(attributes.status_code),
    attributes: {
      service_name: attributes.service_name,
      span_kind: attributes.span_kind,
      status_code: attributes.status_code,
    },
    events: [],
  }
}

export function toTraceData(traceId: string, response: UnifiedLogTraceSpansData): TraceData {
  return { traceId, spans: response.data.map((span) => toSpan(span, traceId)) }
}

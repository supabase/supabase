import { SEARCH_PARAMS_PARSER } from '../UnifiedLogs.constants'
import { logAttributeFilterId, logsFiltersToUrlParams } from '../UnifiedLogs.filters'
import type { ColumnSchema } from '../UnifiedLogs.schema'
import { TIMELINE_WINDOW_MS } from '@/data/logs/unified-log-request-timeline-query'
import type { TraceSpan } from '@/data/logs/unified-log-trace-spans-query'
import { BASE_PATH } from '@/lib/constants'

/** Spans shown under one expanded row before the rest are folded into a "+N more" line. */
export const MAX_SPAN_ROWS = 8

export interface TraceSpanRow {
  id: string
  name: string
  service: string
  status: string
  /** Milliseconds after the row's own span started. */
  offsetMs: number
  durationMs: number
}

export interface TraceSummary {
  spanCount: number
  services: string[]
}

/**
 * Spans carry no request or trace identifier of their own, so a log can only be tied to a span
 * through the `span_id` it recorded. Service name and timestamp proximity are many-to-many and
 * would mis-attribute spans, so neither is used as a fallback.
 */
export function getLogSpanId(log: ColumnSchema): string | undefined {
  const spanId = log.metadata?.span_id
  return typeof spanId === 'string' && spanId.length > 0 ? spanId : undefined
}

function toSpanRow(span: TraceSpan, anchorMs: number): TraceSpanRow {
  const { attributes } = span
  return {
    id: span.id,
    name: attributes.span_name,
    service: attributes.service_name,
    status: attributes.status_code,
    offsetMs: Date.parse(attributes.start_time) - anchorMs,
    durationMs: attributes.duration_ns / 1_000_000,
  }
}

/**
 * The span a log recorded, plus that span's direct children — one level only. Offsets are
 * relative to the log's own span, so it always reads as the zero point.
 */
export function getSpansForLog(spans: TraceSpan[], log: ColumnSchema): TraceSpanRow[] {
  const spanId = getLogSpanId(log)
  if (spanId === undefined) return []

  const ownSpan = spans.find((span) => span.id === spanId)
  if (ownSpan === undefined) return []

  const anchorMs = Date.parse(ownSpan.attributes.start_time)
  if (Number.isNaN(anchorMs)) return []

  const children = spans.filter((span) => span.attributes.parent_span_id === spanId)
  return [ownSpan, ...children]
    .map((span) => toSpanRow(span, anchorMs))
    .sort((a, b) => a.offsetMs - b.offsetMs)
}

export function getTraceSummary(spans: TraceSpan[]): TraceSummary {
  const services = [...new Set(spans.map((span) => span.attributes.service_name))]
    .filter((service) => service.length > 0)
    .sort()
  return { spanCount: spans.length, services }
}

/** Trace IDs are 32 hex characters, far too long to read inline. */
export function getShortTraceId(traceId: string): string {
  if (traceId.length <= 12) return traceId
  return `${traceId.slice(0, 8)}…${traceId.slice(-4)}`
}

export function formatOffsetMs(ms: number): string {
  if (ms < 1000) return `+${Math.round(ms)} ms`
  return `+${(ms / 1000).toFixed(2)} s`
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

/**
 * Unified logs filtered to one trace. The date range brackets the log that resolved the trace,
 * since the destination otherwise applies its own default window and may show nothing.
 */
export function getTraceLogsHref({
  projectRef,
  traceId,
  logTimestampMs,
}: {
  projectRef: string
  traceId: string
  logTimestampMs: number | null
}): string {
  const params = new URLSearchParams({
    filter: SEARCH_PARAMS_PARSER.filter.serialize(
      logsFiltersToUrlParams([
        { column: logAttributeFilterId('trace_id'), operator: '=', value: traceId },
      ])
    ),
  })
  if (logTimestampMs !== null) {
    params.set(
      'date',
      SEARCH_PARAMS_PARSER.date.serialize([
        new Date(logTimestampMs - TIMELINE_WINDOW_MS),
        new Date(logTimestampMs + TIMELINE_WINDOW_MS),
      ])
    )
  }
  return `${BASE_PATH}/project/${projectRef}/logs?${params.toString()}`
}

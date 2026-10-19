// DEBUG-242 trace view — adapts queryTraces()'s plain-JSON result onto the
// ui-patterns/Trace library's Span model, and attaches Supabase log lines as
// extra child rows in the same tree. Nothing here builds a flame chart: every
// row is either a real span or a log line, positioned on one shared timeline.
import type { Span, SpanStatus } from 'ui-patterns/Trace'

import { LOG_TYPES_LABELS } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { queryTraces, type TraceLogEntry } from '@/lib/debug-mode/query-traces'
import type { OtelSpanFixture } from '@/lib/debug-mode/trace-fixtures'
import type { DebugLevel } from '@/state/debug-mode'

export type TraceRowKind = 'span' | 'log-line' | 'debug-note'

const LOG_PREFIX = 'log:'
const NOTE_PREFIX = 'note:'

export const logRowId = (traceSpanId: string): string => `${LOG_PREFIX}${traceSpanId}`
export const toUnderlyingLogId = (traceSpanId: string): string | null =>
  traceSpanId.startsWith(LOG_PREFIX) ? traceSpanId.slice(LOG_PREFIX.length) : null

export function rowKindOf(span: Span): TraceRowKind {
  const kind = span.attributes.__kind
  return kind === 'log-line' || kind === 'debug-note' ? kind : 'span'
}

export function statusMessageOf(span: Span): string | null {
  const value = span.attributes.__statusMessage
  return typeof value === 'string' ? value : null
}

export function logEntryOf(span: Span): TraceLogEntry | null {
  const value = span.attributes.__log
  return value && typeof value === 'object' ? (value as TraceLogEntry) : null
}

export function droppedCountOf(span: Span): number {
  const value = span.attributes.__droppedCount
  return typeof value === 'number' ? value : 0
}

function toSpanStatus(code: OtelSpanFixture['status']['code']): SpanStatus {
  if (code === 'ERROR') return 'error'
  if (code === 'OK') return 'ok'
  return 'unset'
}

function toTraceSpan(span: OtelSpanFixture): Span {
  return {
    id: span.span_id,
    parentId: span.parent_span_id,
    traceId: span.trace_id,
    name: span.name,
    serviceName: span.resource.attributes['service.name'],
    kind: span.kind.toLowerCase(),
    startMs: new Date(span.start_time).getTime(),
    endMs: new Date(span.end_time).getTime(),
    status: toSpanStatus(span.status.code),
    attributes: {
      ...span.attributes,
      __kind: 'span' satisfies TraceRowKind,
      __statusMessage: span.status.message ?? null,
    },
    events: [],
    links: [],
  }
}

function toLogLineSpan(log: TraceLogEntry, traceId: string): Span {
  return {
    id: logRowId(log.id),
    parentId: log.span_id,
    traceId,
    name: log.event_message,
    serviceName: LOG_TYPES_LABELS[log.log_type as keyof typeof LOG_TYPES_LABELS] ?? log.log_type,
    kind: 'log-line',
    startMs: log.timestamp,
    endMs: log.timestamp,
    status: 'unset',
    attributes: { __kind: 'log-line' satisfies TraceRowKind, __log: log },
    events: [],
    links: [],
  }
}

function toDebugNoteSpan(
  ownerSpanId: string,
  traceId: string,
  atMs: number,
  droppedCount: number
): Span {
  return {
    id: `${NOTE_PREFIX}${ownerSpanId}`,
    parentId: ownerSpanId,
    traceId,
    name: 'Supabase 2xx logs not kept at min',
    serviceName: '',
    kind: 'debug-note',
    startMs: atMs,
    endMs: atMs,
    status: 'unset',
    attributes: { __kind: 'debug-note' satisfies TraceRowKind, __droppedCount: droppedCount },
    events: [],
    links: [],
  }
}

export interface CombinedTrace {
  spans: Span[]
  /** True when this trace has no Supabase-side logs at all (e.g. a trace with no Supabase calls). */
  hasNoLogs: boolean
}

export function buildCombinedTrace(traceId: string, debugLevel: DebugLevel): CombinedTrace {
  const { spans: rawSpans, logs } = queryTraces({ trace_id: traceId })
  const spans: Span[] = rawSpans.map(toTraceSpan)

  const logsBySpanId = new Map<string, TraceLogEntry[]>()
  logs.forEach((log) => {
    if (!log.span_id) return
    const list = logsBySpanId.get(log.span_id) ?? []
    list.push(log)
    logsBySpanId.set(log.span_id, list)
  })

  logsBySpanId.forEach((spanLogs, spanId) => {
    const ownerSpan = rawSpans.find((s) => s.span_id === spanId)
    if (!ownerSpan) return

    // Debug mode only governs log visibility — never drops the span itself.
    const visibleLogs =
      debugLevel === 'max' ? spanLogs : spanLogs.filter((log) => log.level !== 'success')
    visibleLogs.forEach((log) => spans.push(toLogLineSpan(log, traceId)))

    const droppedCount = spanLogs.length - visibleLogs.length
    if (droppedCount > 0) {
      const atMs = new Date(ownerSpan.end_time).getTime()
      spans.push(toDebugNoteSpan(spanId, traceId, atMs, droppedCount))
    }
  })

  return { spans, hasNoLogs: logs.length === 0 }
}

export interface TraceStep {
  id: string
  logId: string | null
}

/**
 * Flattened DFS order (root spans and their children, sorted by start time),
 * matching what the Trace library's own tree would show since nothing here
 * is ever collapsed. Computed independently so the panel's up/down controls
 * can step through it without reaching into the library's internal state.
 */
export function buildTraceSteps(spans: readonly Span[]): TraceStep[] {
  const byId = new Map(spans.map((span) => [span.id, span]))
  const childrenOf = new Map<string, Span[]>()
  const roots: Span[] = []

  spans.forEach((span) => {
    if (span.parentId !== null && byId.has(span.parentId)) {
      const list = childrenOf.get(span.parentId) ?? []
      list.push(span)
      childrenOf.set(span.parentId, list)
    } else {
      roots.push(span)
    }
  })

  const byStart = (a: Span, b: Span) => a.startMs - b.startMs
  roots.sort(byStart)
  childrenOf.forEach((list) => list.sort(byStart))

  const steps: TraceStep[] = []
  const visit = (span: Span) => {
    steps.push({ id: span.id, logId: toUnderlyingLogId(span.id) })
    childrenOf.get(span.id)?.forEach(visit)
  }
  roots.forEach(visit)
  return steps
}

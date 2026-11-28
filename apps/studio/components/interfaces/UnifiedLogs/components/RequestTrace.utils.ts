import type { Span, SpanStatus, TraceData } from 'ui-patterns/Trace'

import type { TraceSpan, UnifiedLogTraceSpansData } from '@/data/logs/unified-log-trace-spans-query'

/** Each service that reported a span, once, sorted. */
export function getTraceServices(spans: readonly TraceSpan[]): string[] {
  return [...new Set(spans.map((span) => span.attributes.service_name))]
    .filter((service) => service.length > 0)
    .sort()
}

function toSpanStatus(statusCode: string): SpanStatus {
  if (statusCode === 'error') return 'error'
  if (statusCode === 'ok') return 'ok'
  return 'unset'
}

/**
 * `Date.parse` only resolves to whole milliseconds, so two spans a sub-millisecond apart would
 * otherwise round to the same instant and render stacked on top of each other. This adds back
 * whatever precision the ISO string carries past the 3rd decimal place as a fractional ms.
 */
function parseStartMs(startTime: string): number {
  const ms = Date.parse(startTime)
  if (Number.isNaN(ms)) return ms
  const subMsDigits = startTime.match(/\.\d{3}(\d+)/)?.[1]
  return subMsDigits ? ms + Number(`0.${subMsDigits}`) : ms
}

/**
 * A span the waterfall can place. Returns null when `start_time` is unparseable: there is no
 * honest position for it, and a NaN start would poison the trace's time bounds.
 */
function toSpan(span: TraceSpan, traceId: string): Span | null {
  const { attributes } = span
  const startMs = parseStartMs(attributes.start_time)
  if (Number.isNaN(startMs)) return null

  // `endMs: null` means "still running" to the Trace primitives, which would extend the bar to
  // now. A missing or zero duration is drawn as zero width instead — the data, not a guess.
  const durationMs = Number.isFinite(attributes.duration_ns) ? attributes.duration_ns / 1e6 : 0
  return {
    id: span.id,
    parentId: attributes.parent_span_id,
    traceId,
    name: attributes.span_name,
    startMs,
    endMs: startMs + Math.max(0, durationMs),
    status: toSpanStatus(attributes.status_code),
    // Forwarded as-is (including anything beyond the known fields, now that the query's schema
    // passes it through) so Trace.Inspector can show the full set, not a hand-picked subset.
    attributes,
    events: [],
  }
}

/**
 * The Trace index treats a span whose parent is absent as a root, so a sampled-away parent simply
 * leaves a gap. It cannot handle a parent chain that loops back on itself, so the back-edge of
 * any cycle is cut here by making that span a root too.
 */
function breakCycles(spans: Span[]): Span[] {
  // Parents are read from here, not from the spans, so a cut made for one span is visible when
  // the next span's chain is walked — otherwise every member of a cycle would be cut.
  const parentOf = new Map(spans.map((span) => [span.id, span.parentId]))
  for (const span of spans) {
    const seen = new Set([span.id])
    let current = parentOf.get(span.id) ?? null
    while (current !== null) {
      if (seen.has(current)) {
        parentOf.set(span.id, null)
        break
      }
      seen.add(current)
      current = parentOf.get(current) ?? null
    }
  }
  return spans.map((span) => {
    const parentId = parentOf.get(span.id) ?? null
    return parentId === span.parentId ? span : { ...span, parentId }
  })
}

interface PlacedTrace {
  trace: TraceData
  /** Spans left out because they had no parseable start time. */
  unplacedCount: number
}

export function toTraceData(traceId: string, response: UnifiedLogTraceSpansData): PlacedTrace {
  const placed: Span[] = []
  let unplacedCount = 0
  for (const span of response.data) {
    const converted = toSpan(span, traceId)
    if (converted === null) unplacedCount++
    else placed.push(converted)
  }
  return { trace: { traceId, spans: breakCycles(placed) }, unplacedCount }
}

/** Absolute start of the earliest placed span, for the header. */
export function getTraceStartMs(trace: TraceData): number | null {
  if (trace.spans.length === 0) return null
  return Math.min(...trace.spans.map((span) => span.startMs))
}

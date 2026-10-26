import type { Span, TimeScale, TimeWindow, TraceIndex } from './types'

export function buildTraceIndex(
  spans: readonly Span[],
  nowMs?: number,
  minRangeMs?: number
): TraceIndex {
  const byId = new Map<string, Span>()
  for (const span of spans) byId.set(span.id, span)

  const childrenOf = new Map<string, string[]>()
  const roots: string[] = []
  let minStart = Number.POSITIVE_INFINITY
  let maxKnown = Number.NEGATIVE_INFINITY
  let isLive = false
  let slowestId: string | null = null
  let slowestDuration = Number.NEGATIVE_INFINITY

  for (const span of byId.values()) {
    minStart = Math.min(minStart, span.startMs)
    maxKnown = Math.max(maxKnown, span.startMs)

    if (span.endMs === null) {
      isLive = true
    } else {
      maxKnown = Math.max(maxKnown, span.endMs)
      const duration = span.endMs - span.startMs
      if (duration > slowestDuration) {
        slowestDuration = duration
        slowestId = span.id
      }
    }

    if (span.parentId !== null && byId.has(span.parentId)) {
      const siblings = childrenOf.get(span.parentId)
      if (siblings) siblings.push(span.id)
      else childrenOf.set(span.parentId, [span.id])
    } else {
      roots.push(span.id)
    }
  }

  const byStart = (a: string, b: string) => {
    const diff = byId.get(a)!.startMs - byId.get(b)!.startMs
    if (diff !== 0) return diff
    return a < b ? -1 : a > b ? 1 : 0
  }
  roots.sort(byStart)
  for (const ids of childrenOf.values()) ids.sort(byStart)

  const hasSpans = Number.isFinite(minStart)
  const resolvedNowMs = nowMs ?? (hasSpans ? maxKnown : 0)

  let maxEnd = maxKnown
  for (const span of byId.values()) {
    if (span.endMs === null) maxEnd = Math.max(maxEnd, span.startMs, resolvedNowMs)
  }
  if (isLive && minRangeMs !== undefined) maxEnd = Math.max(maxEnd, minStart + minRangeMs)

  return {
    spans,
    byId,
    childrenOf,
    roots,
    bounds: hasSpans ? [minStart, maxEnd] : [0, 0],
    nowMs: resolvedNowMs,
    isLive,
    slowestId,
  }
}

export function createTimeScale(window: TimeWindow, width: number): TimeScale {
  const [start, end] = window
  const durationMs = Math.max(0, end - start)
  const toFraction = (ms: number) => (durationMs > 0 ? (ms - start) / durationMs : 0)
  return {
    window,
    width,
    durationMs,
    toFraction,
    toX: (ms) => toFraction(ms) * width,
    toMs: (x) => (width > 0 ? start + (x / width) * durationMs : start),
  }
}

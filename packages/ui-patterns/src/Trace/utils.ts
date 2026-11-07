import type { Span, TimeScale, TimeTick, TimeWindow, TraceIndex, VisibleRow } from './types'

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

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const TARGET_TICK_SPACING = 80

const TICK_STEPS = [
  0.001,
  0.002,
  0.005,
  0.01,
  0.02,
  0.05,
  0.1,
  0.2,
  0.5,
  1,
  2,
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  SECOND,
  2 * SECOND,
  5 * SECOND,
  10 * SECOND,
  15 * SECOND,
  30 * SECOND,
  MINUTE,
  2 * MINUTE,
  5 * MINUTE,
  10 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
]

export function niceTickStep(durationMs: number, maxTicks: number): number {
  const raw = durationMs / maxTicks
  const step = TICK_STEPS.find((candidate) => candidate >= raw)
  return step ?? Math.ceil(raw / HOUR) * HOUR
}

function formatScaled(ms: number, unitMs: number, suffix: string, stepMs: number): string {
  const digits = Math.max(0, -Math.floor(Math.log10(stepMs / unitMs) + 1e-9))
  return `${Number((ms / unitMs).toFixed(digits))}${suffix}`
}

export function formatMs(ms: number, stepMs: number): string {
  if (ms === 0) return '0ms'
  if (ms < 1) return formatScaled(ms, 0.001, 'µs', stepMs)
  if (ms < SECOND) return formatScaled(ms, 1, 'ms', stepMs)
  if (ms < MINUTE) return formatScaled(ms, SECOND, 's', stepMs)
  if (ms < HOUR) {
    const minutes = Math.floor(ms / MINUTE)
    const seconds = Math.round((ms - minutes * MINUTE) / SECOND)
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`
  }
  const hours = Math.floor(ms / HOUR)
  const minutes = Math.round((ms - hours * HOUR) / MINUTE)
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

function computeTicks([start, end]: TimeWindow, width: number): TimeTick[] {
  const durationMs = end - start
  if (!(durationMs > 0) || !(width > 0)) return []

  const stepMs = niceTickStep(durationMs, Math.max(1, Math.floor(width / TARGET_TICK_SPACING)))
  const ticks: TimeTick[] = []
  for (let offset = 0; offset <= durationMs + 1e-9; offset += stepMs) {
    ticks.push({
      ms: start + offset,
      fraction: offset / durationMs,
      label: formatMs(offset, stepMs),
    })
  }
  return ticks
}

export function createTimeScale(window: TimeWindow, width: number): TimeScale {
  const [start, end] = window
  const durationMs = Math.max(0, end - start)
  const toFraction = (ms: number) => (durationMs > 0 ? (ms - start) / durationMs : 0)
  return {
    window,
    width,
    durationMs,
    ticks: computeTicks(window, width),
    toFraction,
    toX: (ms) => toFraction(ms) * width,
    toMs: (x) => (width > 0 ? start + (x / width) * durationMs : start),
  }
}

export function formatDuration(ms: number): string {
  return ms > 0 ? formatMs(ms, 10 ** (Math.floor(Math.log10(ms)) - 2)) : '0ms'
}

export function flattenTree(index: TraceIndex, collapsed: ReadonlySet<string>): VisibleRow[] {
  const rows: VisibleRow[] = []
  const stack = index.roots.map((id) => ({ id, depth: 0 })).reverse()

  while (stack.length > 0) {
    const { id, depth } = stack.pop()!
    const children = index.childrenOf.get(id) ?? []
    const hasChildren = children.length > 0
    const isExpanded = hasChildren && !collapsed.has(id)
    rows.push({ span: index.byId.get(id)!, depth, hasChildren, isExpanded })
    if (!isExpanded) continue
    for (let i = children.length - 1; i >= 0; i--) stack.push({ id: children[i], depth: depth + 1 })
  }

  return rows
}

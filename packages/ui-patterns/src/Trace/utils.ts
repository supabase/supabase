import type {
  BarGeometry,
  BrushEdge,
  BrushRect,
  FilterMatch,
  FilterTerm,
  KeyboardAction,
  MarkerKind,
  Span,
  SpanEvent,
  TimeScale,
  TimeScaleOptions,
  TimeTick,
  TimeWindow,
  TraceIndex,
  ValueKind,
  VisibleRow,
} from './types'

// Trace index

export function effectiveEndMs(span: Pick<Span, 'startMs' | 'endMs'>, nowMs: number): number {
  if (span.endMs === null) return Math.max(span.startMs, nowMs)
  return span.endMs
}

export function durationOf(span: Pick<Span, 'startMs' | 'endMs'>, nowMs: number): number {
  return Math.max(0, effectiveEndMs(span, nowMs) - span.startMs)
}

function compareByStart(byId: ReadonlyMap<string, Span>) {
  return (a: string, b: string) => {
    const sa = byId.get(a)!
    const sb = byId.get(b)!
    if (sa.startMs !== sb.startMs) return sa.startMs - sb.startMs
    return sa.id < sb.id ? -1 : sa.id > sb.id ? 1 : 0
  }
}

export function buildTraceIndex(spans: readonly Span[], nowMs?: number): TraceIndex {
  const byId = new Map<string, Span>()
  for (const span of spans) byId.set(span.id, span)

  const childrenOf = new Map<string, string[]>()
  const roots: string[] = []
  const orphanIds = new Set<string>()
  const services = new Set<string>()

  let minStart = Number.POSITIVE_INFINITY
  let maxKnown = Number.NEGATIVE_INFINITY

  for (const span of byId.values()) {
    services.add(span.serviceName)
    if (span.startMs < minStart) minStart = span.startMs
    if (span.startMs > maxKnown) maxKnown = span.startMs
    if (span.endMs !== null && span.endMs > maxKnown) maxKnown = span.endMs

    const hasParent = span.parentId !== null && byId.has(span.parentId)
    if (span.parentId !== null && !hasParent) orphanIds.add(span.id)
    if (!hasParent) {
      roots.push(span.id)
      continue
    }
    const siblings = childrenOf.get(span.parentId!)
    if (siblings) siblings.push(span.id)
    else childrenOf.set(span.parentId!, [span.id])
  }

  const compare = compareByStart(byId)
  roots.sort(compare)
  for (const ids of childrenOf.values()) ids.sort(compare)

  const resolvedNow = nowMs ?? (Number.isFinite(maxKnown) ? maxKnown : 0)

  let maxEnd = maxKnown
  for (const span of byId.values()) {
    const end = effectiveEndMs(span, resolvedNow)
    if (end > maxEnd) maxEnd = end
  }

  const depthOf = new Map<string, number>()
  const descendantCountOf = new Map<string, number>()
  const postOrder: string[] = []
  const stack: Array<{ id: string; depth: number }> = []
  for (let i = roots.length - 1; i >= 0; i--) stack.push({ id: roots[i], depth: 0 })

  while (stack.length > 0) {
    const { id, depth } = stack.pop()!
    if (depthOf.has(id)) continue
    depthOf.set(id, depth)
    postOrder.push(id)
    const children = childrenOf.get(id)
    if (!children) continue
    for (let i = children.length - 1; i >= 0; i--) stack.push({ id: children[i], depth: depth + 1 })
  }

  for (let i = postOrder.length - 1; i >= 0; i--) {
    const id = postOrder[i]
    const children = childrenOf.get(id)
    let count = 0
    if (children) {
      for (const child of children) count += 1 + (descendantCountOf.get(child) ?? 0)
    }
    descendantCountOf.set(id, count)
  }

  const bounds: TimeWindow = Number.isFinite(minStart)
    ? [minStart, Math.max(maxEnd, minStart)]
    : [0, 0]

  return {
    spans,
    byId,
    childrenOf,
    roots,
    orphanIds,
    depthOf,
    descendantCountOf,
    bounds,
    nowMs: resolvedNow,
    serviceNames: Array.from(services).sort(),
  }
}

export const EMPTY_TRACE_INDEX: TraceIndex = buildTraceIndex([])

// Tree flattening

export function collectAncestors(
  index: TraceIndex,
  matchIds: ReadonlySet<string>
): ReadonlySet<string> {
  const keep = new Set<string>(matchIds)
  for (const id of matchIds) {
    let current = index.byId.get(id)
    while (current && current.parentId !== null) {
      const parent = index.byId.get(current.parentId)
      if (!parent || keep.has(parent.id)) break
      keep.add(parent.id)
      current = parent
    }
  }
  return keep
}

interface Frame {
  id: string
  depth: number
  siblingIndex: number
  siblingCount: number
  guides: boolean[]
}

export function flattenTree(
  index: TraceIndex,
  collapsedIds: ReadonlySet<string>,
  matchIds: ReadonlySet<string> | null
): VisibleRow[] {
  const keep = matchIds ? collectAncestors(index, matchIds) : null
  const rows: VisibleRow[] = []

  const visibleChildren = (id: string): string[] => {
    const children = index.childrenOf.get(id)
    if (!children) return []
    if (!keep) return children as string[]
    return children.filter((child) => keep.has(child))
  }

  const countVisibleDescendants = (id: string): number => {
    if (!keep) return index.descendantCountOf.get(id) ?? 0
    let count = 0
    const stack = [...visibleChildren(id)]
    while (stack.length > 0) {
      const next = stack.pop()!
      count++
      for (const child of visibleChildren(next)) stack.push(child)
    }
    return count
  }

  const topLevel = keep ? index.roots.filter((id) => keep.has(id)) : index.roots
  const stack: Frame[] = []
  for (let i = topLevel.length - 1; i >= 0; i--) {
    stack.push({
      id: topLevel[i],
      depth: 0,
      siblingIndex: i,
      siblingCount: topLevel.length,
      guides: [],
    })
  }

  while (stack.length > 0) {
    const frame = stack.pop()!
    const span = index.byId.get(frame.id)
    if (!span) continue

    const children = visibleChildren(frame.id)
    const hasChildren = children.length > 0
    const isCollapsed = collapsedIds.has(frame.id)
    const isExpanded = hasChildren && !isCollapsed

    let filterMatch: FilterMatch = 'inactive'
    if (matchIds) filterMatch = matchIds.has(frame.id) ? 'match' : 'ancestor'

    rows.push({
      id: frame.id,
      span,
      index: rows.length,
      depth: frame.depth,
      parentId: span.parentId !== null && index.byId.has(span.parentId) ? span.parentId : null,
      hasChildren,
      isExpanded,
      hiddenDescendantCount: hasChildren && isCollapsed ? countVisibleDescendants(frame.id) : 0,
      isOrphan: index.orphanIds.has(frame.id),
      siblingIndex: frame.siblingIndex,
      siblingCount: frame.siblingCount,
      guides: frame.guides,
      filterMatch,
    })

    if (!isExpanded) continue

    const hasFollowingSibling = frame.siblingIndex < frame.siblingCount - 1
    const childGuides = [...frame.guides, hasFollowingSibling]
    for (let i = children.length - 1; i >= 0; i--) {
      stack.push({
        id: children[i],
        depth: frame.depth + 1,
        siblingIndex: i,
        siblingCount: children.length,
        guides: childGuides,
      })
    }
  }

  return rows
}

export function indexRowsById(rows: readonly VisibleRow[]): ReadonlyMap<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) map.set(row.id, row.index)
  return map
}

// Time scale

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE

const SUB_SECOND_STEPS = [
  0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500,
]

const CLOCK_STEPS = [
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
  2 * HOUR,
  3 * HOUR,
  6 * HOUR,
  12 * HOUR,
  24 * HOUR,
]

export const NICE_STEPS_MS: readonly number[] = [...SUB_SECOND_STEPS, ...CLOCK_STEPS]

export function niceTickStep(durationMs: number, maxTicks: number): number {
  if (!(durationMs > 0) || !(maxTicks > 0)) return 0
  const raw = durationMs / maxTicks
  for (const step of NICE_STEPS_MS) {
    if (step >= raw) return step
  }
  const last = NICE_STEPS_MS[NICE_STEPS_MS.length - 1]
  return Math.ceil(raw / last) * last
}

function trimZeros(value: string): string {
  return value.includes('.') ? value.replace(/\.?0+$/, '') : value
}

export interface FormatMsOptions {
  precision?: number
}

export function formatMs(ms: number, options: FormatMsOptions = {}): string {
  if (!Number.isFinite(ms)) return '–'
  const sign = ms < 0 ? '-' : ''
  const abs = Math.abs(ms)
  const { precision } = options

  if (abs === 0) return '0ms'
  if (abs < 1) {
    const micro = abs * 1000
    const digits = precision ?? (micro < 10 ? 1 : 0)
    return `${sign}${trimZeros(micro.toFixed(digits))}µs`
  }
  if (abs < SECOND) {
    const digits = precision ?? (abs < 10 ? 2 : abs < 100 ? 1 : 0)
    return `${sign}${trimZeros(abs.toFixed(digits))}ms`
  }
  if (abs < MINUTE) {
    const digits = precision ?? 2
    return `${sign}${trimZeros((abs / SECOND).toFixed(digits))}s`
  }
  if (abs < HOUR) {
    const minutes = Math.floor(abs / MINUTE)
    const seconds = Math.round((abs - minutes * MINUTE) / SECOND)
    return seconds === 0 ? `${sign}${minutes}m` : `${sign}${minutes}m ${seconds}s`
  }
  const hours = Math.floor(abs / HOUR)
  const minutes = Math.round((abs - hours * HOUR) / MINUTE)
  return minutes === 0 ? `${sign}${hours}h` : `${sign}${hours}h ${minutes}m`
}

export function precisionForStep(stepMs: number): number {
  if (stepMs <= 0) return 0
  if (stepMs < SECOND) return Math.max(0, -Math.floor(Math.log10(stepMs)))
  if (stepMs < MINUTE) return Math.max(0, -Math.floor(Math.log10(stepMs / SECOND)))
  return 0
}

export function computeTicks(options: Required<TimeScaleOptions>): {
  ticks: TimeTick[]
  stepMs: number
} {
  const { window, width, origin, targetTickSpacing } = options
  const [start, end] = window
  const durationMs = end - start
  if (!(durationMs > 0) || !(width > 0)) return { ticks: [], stepMs: 0 }

  const maxTicks = Math.max(1, Math.floor(width / targetTickSpacing))
  const stepMs = niceTickStep(durationMs, maxTicks)
  if (stepMs <= 0) return { ticks: [], stepMs: 0 }

  const precision = precisionForStep(stepMs)
  const ticks: TimeTick[] = []
  const firstOffset = Math.ceil((start - origin) / stepMs - 1e-9) * stepMs
  const guard = maxTicks + 2

  for (let offset = firstOffset, i = 0; i < guard; offset += stepMs, i++) {
    const ms = origin + offset
    if (ms > end + 1e-9) break
    if (ms < start - 1e-9) continue
    const fraction = (ms - start) / durationMs
    ticks.push({
      ms,
      fraction,
      x: fraction * width,
      label: formatMs(ms - origin, { precision }),
    })
  }

  return { ticks, stepMs }
}

export function computeTimeScale(options: TimeScaleOptions): TimeScale {
  const window = options.window
  const width = Math.max(0, options.width)
  const origin = options.origin ?? window[0]
  const targetTickSpacing = options.targetTickSpacing ?? 80
  const durationMs = window[1] - window[0]
  const pxPerMs = durationMs > 0 ? width / durationMs : 0

  const { ticks, stepMs } = computeTicks({ window, width, origin, targetTickSpacing })

  return {
    window,
    origin,
    width,
    durationMs,
    pxPerMs,
    stepMs,
    ticks,
    toFraction: (ms) => (durationMs > 0 ? (ms - window[0]) / durationMs : 0),
    toX: (ms) => (durationMs > 0 ? ((ms - window[0]) / durationMs) * width : 0),
    toMs: (x) => (width > 0 ? window[0] + (x / width) * durationMs : window[0]),
    format: (ms) => formatMs(ms),
  }
}

// Filter

export function parseFilterQuery(query: string): FilterTerm[] {
  const terms: FilterTerm[] = []
  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
  for (const raw of tokens) {
    let token = raw
    let negate = false
    if (token.startsWith('-') && token.length > 1) {
      negate = true
      token = token.slice(1)
    }
    const separator = token.search(/[:=]/)
    if (separator > 0) {
      const key = token.slice(0, separator)
      const value = stripQuotes(token.slice(separator + 1))
      terms.push({ key, value, negate })
    } else {
      terms.push({ key: null, value: stripQuotes(token), negate })
    }
  }
  return terms
}

function stripQuotes(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1)
  return value
}

function includesInsensitive(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle)
}

function fieldValue(span: Span, key: string): unknown {
  switch (key) {
    case 'name':
      return span.name
    case 'service':
    case 'serviceName':
      return span.serviceName
    case 'status':
      return span.status
    case 'kind':
      return span.kind
    case 'id':
      return span.id
    default:
      return span.attributes[key]
  }
}

function matchTerm(span: Span, term: FilterTerm): boolean {
  const needle = term.value.toLowerCase()
  if (term.key !== null) {
    const value = fieldValue(span, term.key)
    if (value === undefined || value === null) return needle === 'null' && value === null
    return needle === '' ? true : includesInsensitive(String(value), needle)
  }
  if (needle === '') return true
  if (includesInsensitive(span.name, needle)) return true
  if (includesInsensitive(span.serviceName, needle)) return true
  if (includesInsensitive(span.id, needle)) return true
  for (const value of Object.values(span.attributes)) {
    if (typeof value === 'string' && includesInsensitive(value, needle)) return true
    if (typeof value === 'number' && String(value).includes(needle)) return true
  }
  for (const event of span.events) {
    if (includesInsensitive(event.name, needle)) return true
  }
  return false
}

export function matchTerms(span: Span, terms: readonly FilterTerm[]): boolean {
  for (const term of terms) {
    const matched = matchTerm(span, term)
    if (term.negate ? matched : !matched) return false
  }
  return true
}

export function matches(span: Span, query: string): boolean {
  const terms = parseFilterQuery(query)
  if (terms.length === 0) return true
  return matchTerms(span, terms)
}

export function computeMatchIds(index: TraceIndex, query: string): ReadonlySet<string> | null {
  if (query.trim() === '') return null
  const result = new Set<string>()
  for (const span of index.byId.values()) {
    if (matches(span, query)) result.add(span.id)
  }
  return result
}

// Brush

export function boundsDuration(bounds: TimeWindow): number {
  return Math.max(0, bounds[1] - bounds[0])
}

export function msToFraction(ms: number, bounds: TimeWindow): number {
  const duration = boundsDuration(bounds)
  if (duration === 0) return 0
  return (ms - bounds[0]) / duration
}

export function fractionToMs(fraction: number, bounds: TimeWindow): number {
  return bounds[0] + fraction * boundsDuration(bounds)
}

export function msToPx(ms: number, bounds: TimeWindow, width: number): number {
  return msToFraction(ms, bounds) * width
}

export function pxToMs(px: number, bounds: TimeWindow, width: number): number {
  if (width <= 0) return bounds[0]
  return fractionToMs(px / width, bounds)
}

export function resolveMinDuration(bounds: TimeWindow, minDurationMs?: number): number {
  const duration = boundsDuration(bounds)
  if (minDurationMs !== undefined) return Math.min(minDurationMs, duration)
  return Math.min(duration, Math.max(duration / 1000, 0.001))
}

export function clampWindow(
  window: TimeWindow,
  bounds: TimeWindow,
  minDurationMs?: number
): TimeWindow {
  const minDuration = resolveMinDuration(bounds, minDurationMs)
  const total = boundsDuration(bounds)
  let [start, end] = window[0] <= window[1] ? window : [window[1], window[0]]

  if (end - start < minDuration) {
    const center = (start + end) / 2
    start = center - minDuration / 2
    end = center + minDuration / 2
  }
  if (end - start >= total) return [bounds[0], bounds[1]]

  if (start < bounds[0]) {
    end += bounds[0] - start
    start = bounds[0]
  }
  if (end > bounds[1]) {
    start -= end - bounds[1]
    end = bounds[1]
  }
  return [Math.max(start, bounds[0]), Math.min(end, bounds[1])]
}

export function panWindow(window: TimeWindow, deltaMs: number, bounds: TimeWindow): TimeWindow {
  const size = window[1] - window[0]
  let start = window[0] + deltaMs
  if (start < bounds[0]) start = bounds[0]
  if (start + size > bounds[1]) start = bounds[1] - size
  return [start, start + size]
}

export function resizeWindow(
  window: TimeWindow,
  edge: BrushEdge,
  ms: number,
  bounds: TimeWindow,
  minDurationMs?: number
): TimeWindow {
  const minDuration = resolveMinDuration(bounds, minDurationMs)
  const clampedMs = Math.min(Math.max(ms, bounds[0]), bounds[1])
  if (edge === 'start') {
    const start = Math.min(clampedMs, window[1] - minDuration)
    return [Math.max(start, bounds[0]), window[1]]
  }
  const end = Math.max(clampedMs, window[0] + minDuration)
  return [window[0], Math.min(end, bounds[1])]
}

export function windowFromDrag(
  aMs: number,
  bMs: number,
  bounds: TimeWindow,
  minDurationMs?: number
): TimeWindow {
  const start = Math.min(aMs, bMs)
  const end = Math.max(aMs, bMs)
  return clampWindow([start, end], bounds, minDurationMs)
}

export function zoomWindow(
  window: TimeWindow,
  factor: number,
  anchorMs: number | undefined,
  bounds: TimeWindow,
  minDurationMs?: number
): TimeWindow {
  if (!(factor > 0)) return window
  const size = window[1] - window[0]
  const anchor = anchorMs ?? (window[0] + window[1]) / 2
  const ratio = size > 0 ? (anchor - window[0]) / size : 0.5
  const nextSize = size * factor
  const start = anchor - ratio * nextSize
  return clampWindow([start, start + nextSize], bounds, minDurationMs)
}

export function brushRect(window: TimeWindow, bounds: TimeWindow, width: number): BrushRect {
  const left = msToPx(window[0], bounds, width)
  const right = msToPx(window[1], bounds, width)
  return { left, width: Math.max(0, right - left) }
}

export function isFullWindow(window: TimeWindow, bounds: TimeWindow): boolean {
  return window[0] <= bounds[0] && window[1] >= bounds[1]
}

// Keyboard

export interface ResolveKeyboardActionInput {
  key: string
  rows: readonly VisibleRow[]
  selectedId: string | null
  rowIndexById: ReadonlyMap<string, number>
}

export function resolveKeyboardAction(input: ResolveKeyboardActionInput): KeyboardAction | null {
  const { key, rows, selectedId, rowIndexById } = input
  if (rows.length === 0) return null

  const currentIndex = selectedId !== null ? (rowIndexById.get(selectedId) ?? -1) : -1
  const current = currentIndex >= 0 ? rows[currentIndex] : null

  switch (key) {
    case 'ArrowDown': {
      if (!current) return { type: 'select', id: rows[0].id }
      const next = rows[Math.min(currentIndex + 1, rows.length - 1)]
      return next.id === current.id ? null : { type: 'select', id: next.id }
    }
    case 'ArrowUp': {
      if (!current) return { type: 'select', id: rows[rows.length - 1].id }
      const prev = rows[Math.max(currentIndex - 1, 0)]
      return prev.id === current.id ? null : { type: 'select', id: prev.id }
    }
    case 'Home':
      return rows[0].id === selectedId ? null : { type: 'select', id: rows[0].id }
    case 'End': {
      const last = rows[rows.length - 1]
      return last.id === selectedId ? null : { type: 'select', id: last.id }
    }
    case 'ArrowRight': {
      if (!current) return { type: 'select', id: rows[0].id }
      if (current.hasChildren && !current.isExpanded) return { type: 'expand', id: current.id }
      if (current.isExpanded && currentIndex + 1 < rows.length) {
        return { type: 'select', id: rows[currentIndex + 1].id }
      }
      return null
    }
    case 'ArrowLeft': {
      if (!current) return { type: 'select', id: rows[0].id }
      if (current.isExpanded) return { type: 'collapse', id: current.id }
      if (current.parentId !== null && rowIndexById.has(current.parentId)) {
        return { type: 'select', id: current.parentId }
      }
      return null
    }
    default:
      return null
  }
}

export const NAVIGATION_KEYS: ReadonlySet<string> = new Set([
  'ArrowDown',
  'ArrowUp',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
])

// Bar geometry

export function computeBarGeometry(
  startMs: number,
  endMs: number,
  window: TimeWindow
): BarGeometry {
  const [windowStart, windowEnd] = window
  const duration = windowEnd - windowStart
  const end = Math.max(startMs, endMs)
  const isZeroDuration = end === startMs

  if (!(duration > 0)) {
    return { isVisible: false, isZeroDuration, clip: 'none', leftFraction: 0, widthFraction: 0 }
  }

  const startFraction = (startMs - windowStart) / duration
  const endFraction = (end - windowStart) / duration

  if (endFraction < 0 || startFraction > 1) {
    return { isVisible: false, isZeroDuration, clip: 'none', leftFraction: 0, widthFraction: 0 }
  }

  const clipStart = startFraction < 0
  const clipEnd = endFraction > 1
  let clip: BarGeometry['clip'] = 'none'
  if (clipStart && clipEnd) clip = 'both'
  else if (clipStart) clip = 'start'
  else if (clipEnd) clip = 'end'

  const left = Math.max(0, startFraction)
  const right = Math.min(1, endFraction)

  return {
    isVisible: true,
    isZeroDuration,
    clip,
    leftFraction: left,
    widthFraction: Math.max(0, right - left),
  }
}

// Markers

export function inferMarkerKind(event: SpanEvent): MarkerKind {
  const name = event.name.toLowerCase()
  const attributes = event.attributes ?? {}
  if (name === 'exception' || name.includes('error') || 'exception.type' in attributes) {
    return 'exception'
  }
  if (name === 'log' || name.startsWith('log.') || 'log.severity' in attributes) {
    return 'log'
  }
  return 'milestone'
}

export const MARKER_KIND_LABEL: Record<MarkerKind, string> = {
  log: 'Log',
  exception: 'Exception',
  milestone: 'Milestone',
}

// Key-value rendering

const URL_PATTERN = /^https?:\/\/\S+$/i
const ID_KEY_PATTERN = /(^|[._-])(span_?id|trace_?id|parent_?(span_?)?id|id)$/i
const ERROR_KEY_PATTERN = /(exception|error|stack|stacktrace)/i

export function detectValueKind(key: string, value: unknown): ValueKind {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number' || typeof value === 'bigint') return 'number'
  if (typeof value === 'object') return 'json'
  if (typeof value === 'string') {
    if (URL_PATTERN.test(value)) return 'url'
    if (ID_KEY_PATTERN.test(key)) return 'id'
    if (ERROR_KEY_PATTERN.test(key)) return 'error'
    return 'string'
  }
  return 'string'
}

export function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return value
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

export function summarizeJson(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length === 1 ? 'Array (1 item)' : `Array (${value.length} items)`
  }
  if (value && typeof value === 'object') {
    const size = Object.keys(value).length
    return size === 1 ? 'Object (1 key)' : `Object (${size} keys)`
  }
  return 'Value'
}

export function sortedEntries(data: Record<string, unknown>): Array<[string, unknown]> {
  return Object.entries(data).sort(([a], [b]) => a.localeCompare(b))
}

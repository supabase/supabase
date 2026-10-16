import { describe, expect, it } from 'vitest'

import type { Span, TimeWindow } from './types'
import {
  brushRect,
  buildTraceIndex,
  clampWindow,
  collectAncestors,
  computeBarGeometry,
  computeMatchIds,
  computeTicks,
  computeTimeScale,
  flattenTree,
  formatMs,
  indexRowsById,
  isFullWindow,
  matches,
  matchTerms,
  msToPx,
  niceTickStep,
  panWindow,
  parseFilterQuery,
  precisionForStep,
  pxToMs,
  resizeWindow,
  resolveKeyboardAction,
  windowFromDrag,
  zoomWindow,
} from './utils'

function makeSpan(
  id: string,
  parentId: string | null,
  startMs: number,
  endMs: number | null,
  overrides: Partial<Span> = {}
): Span {
  return {
    id,
    parentId,
    traceId: 't',
    name: id,
    serviceName: 'svc',
    kind: 'internal',
    startMs,
    endMs,
    status: 'ok',
    attributes: {},
    events: [],
    links: [],
    ...overrides,
  }
}

describe('niceTickStep', () => {
  it('picks the smallest 1-2-5 step that fits the tick budget', () => {
    expect(niceTickStep(1000, 10)).toBe(100)
    expect(niceTickStep(1000, 25)).toBe(50)
    expect(niceTickStep(412, 8)).toBe(100)
    expect(niceTickStep(3, 6)).toBe(0.5)
  })

  it('switches to clock-friendly steps above one second', () => {
    expect(niceTickStep(60_000, 5)).toBe(15_000)
    expect(niceTickStep(10 * 60_000, 6)).toBe(2 * 60_000)
    expect(niceTickStep(3 * 3_600_000, 4)).toBe(3_600_000)
  })

  it('extends beyond the table in whole-day multiples', () => {
    const step = niceTickStep(10 * 24 * 3_600_000, 2)
    expect(step % (24 * 3_600_000)).toBe(0)
  })

  it('returns 0 for degenerate input', () => {
    expect(niceTickStep(0, 10)).toBe(0)
    expect(niceTickStep(100, 0)).toBe(0)
  })
})

describe('formatMs', () => {
  it('formats sub-millisecond values in microseconds', () => {
    expect(formatMs(0)).toBe('0ms')
    expect(formatMs(0.25)).toBe('250µs')
    expect(formatMs(0.0042)).toBe('4.2µs')
  })

  it('formats milliseconds with fewer decimals as the value grows', () => {
    expect(formatMs(1.234)).toBe('1.23ms')
    expect(formatMs(12.34)).toBe('12.3ms')
    expect(formatMs(123.4)).toBe('123ms')
  })

  it('formats seconds, minutes, and hours', () => {
    expect(formatMs(1500)).toBe('1.5s')
    expect(formatMs(65_000)).toBe('1m 5s')
    expect(formatMs(120_000)).toBe('2m')
    expect(formatMs(3_600_000 + 30 * 60_000)).toBe('1h 30m')
  })

  it('respects explicit precision and negative values', () => {
    expect(formatMs(50.04, { precision: 2 })).toBe('50.04ms')
    expect(formatMs(-250)).toBe('-250ms')
  })
})

describe('precisionForStep', () => {
  it('derives label precision from the tick step', () => {
    expect(precisionForStep(100)).toBe(0)
    expect(precisionForStep(0.5)).toBe(1)
    expect(precisionForStep(0.05)).toBe(2)
    expect(precisionForStep(0.0005)).toBe(4)
  })
})

describe('computeTicks and computeTimeScale', () => {
  it('aligns ticks to the origin, not to the window start', () => {
    const { ticks, stepMs } = computeTicks({
      window: [1030, 1430],
      width: 400,
      origin: 1000,
      targetTickSpacing: 80,
    })
    expect(stepMs).toBe(100)
    expect(ticks.map((tick) => tick.ms)).toEqual([1100, 1200, 1300, 1400])
    expect(ticks.map((tick) => tick.label)).toEqual(['100ms', '200ms', '300ms', '400ms'])
  })

  it('returns nothing without width or duration', () => {
    expect(
      computeTicks({ window: [0, 100], width: 0, origin: 0, targetTickSpacing: 80 }).ticks
    ).toEqual([])
    expect(
      computeTicks({ window: [5, 5], width: 100, origin: 0, targetTickSpacing: 80 }).ticks
    ).toEqual([])
  })

  it('maps ms to x and back', () => {
    const scale = computeTimeScale({ window: [200, 700], width: 1000 })
    expect(scale.toX(450)).toBe(500)
    expect(scale.toFraction(700)).toBe(1)
    expect(scale.toMs(250)).toBe(325)
    expect(scale.pxPerMs).toBe(2)
  })

  it('handles an empty window without dividing by zero', () => {
    const scale = computeTimeScale({ window: [100, 100], width: 300 })
    expect(scale.toX(100)).toBe(0)
    expect(scale.toMs(50)).toBe(100)
  })
})

const treeSpans: Span[] = [
  makeSpan('root', null, 0, 100),
  makeSpan('b', 'root', 40, 60),
  makeSpan('a', 'root', 10, 30),
  makeSpan('a1', 'a', 12, 20),
  makeSpan('a2', 'a', 8, 25),
  makeSpan('b1', 'b', 45, 45),
  makeSpan('orphan', 'ghost', 70, 80),
  makeSpan('running', 'root', 90, null),
]

describe('buildTraceIndex', () => {
  const index = buildTraceIndex(treeSpans)

  it('sorts children by start time and treats orphans as roots', () => {
    expect(index.roots).toEqual(['root', 'orphan'])
    expect(index.childrenOf.get('root')).toEqual(['a', 'b', 'running'])
    expect(index.childrenOf.get('a')).toEqual(['a2', 'a1'])
    expect(index.orphanIds.has('orphan')).toBe(true)
  })

  it('computes depth and descendant counts', () => {
    expect(index.depthOf.get('a1')).toBe(2)
    expect(index.descendantCountOf.get('root')).toBe(6)
    expect(index.descendantCountOf.get('a')).toBe(2)
  })

  it('derives bounds and extends them for running spans when nowMs is provided', () => {
    expect(index.bounds).toEqual([0, 100])
    expect(buildTraceIndex(treeSpans, 150).bounds).toEqual([0, 150])
    expect(buildTraceIndex([]).bounds).toEqual([0, 0])
  })
})

describe('flattenTree', () => {
  const index = buildTraceIndex(treeSpans)

  it('flattens depth-first in start order when nothing is collapsed', () => {
    const rows = flattenTree(index, new Set(), null)
    expect(rows.map((row) => row.id)).toEqual([
      'root',
      'a',
      'a2',
      'a1',
      'b',
      'b1',
      'running',
      'orphan',
    ])
    expect(rows.map((row) => row.depth)).toEqual([0, 1, 2, 2, 1, 2, 1, 0])
    expect(rows.every((row) => row.filterMatch === 'inactive')).toBe(true)
  })

  it('hides descendants of collapsed nodes and reports how many are hidden', () => {
    const rows = flattenTree(index, new Set(['a', 'root']), null)
    expect(rows.map((row) => row.id)).toEqual(['root', 'orphan'])
    expect(rows[0].hiddenDescendantCount).toBe(6)
    const partial = flattenTree(index, new Set(['a']), null)
    expect(partial.find((row) => row.id === 'a')?.hiddenDescendantCount).toBe(2)
  })

  it('computes sibling positions and depth guides', () => {
    const rows = flattenTree(index, new Set(), null)
    const a2 = rows.find((row) => row.id === 'a2')!
    expect(a2.siblingIndex).toBe(0)
    expect(a2.siblingCount).toBe(2)
    expect(a2.guides).toEqual([true, true])
    expect(rows.find((row) => row.id === 'running')!.guides).toEqual([true])
  })

  it('keeps matches and their ancestors when a filter is active', () => {
    const rows = flattenTree(index, new Set(), new Set(['a1']))
    expect(rows.map((row) => row.id)).toEqual(['root', 'a', 'a1'])
    expect(rows.map((row) => row.filterMatch)).toEqual(['ancestor', 'ancestor', 'match'])
  })

  it('counts hidden descendants within the filtered set', () => {
    const rows = flattenTree(index, new Set(['root']), new Set(['a1', 'b1']))
    expect(rows.map((row) => row.id)).toEqual(['root'])
    expect(rows[0].hiddenDescendantCount).toBe(4)
    expect(flattenTree(index, new Set(), new Set())).toEqual([])
  })

  it('collects ancestors up to the root and stops at missing parents', () => {
    const keep = collectAncestors(index, new Set(['a1', 'orphan']))
    expect(Array.from(keep).sort()).toEqual(['a', 'a1', 'orphan', 'root'])
  })
})

describe('filter', () => {
  const span = makeSpan('span-1', null, 0, 10, {
    name: 'SELECT orders',
    serviceName: 'postgres',
    kind: 'client',
    status: 'error',
    attributes: {
      'db.statement': 'SELECT * FROM orders',
      'http.status_code': 502,
      'cache.hit': false,
      'user.id': null,
    },
    events: [{ timeMs: 5, name: 'exception' }],
  })

  it('parses free text, key:value terms, quotes, and negation', () => {
    expect(parseFilterQuery('orders status:error service=postgres')).toEqual([
      { key: null, value: 'orders', negate: false },
      { key: 'status', value: 'error', negate: false },
      { key: 'service', value: 'postgres', negate: false },
    ])
    expect(parseFilterQuery('db.statement:"SELECT * FROM" -status:ok -cache')).toEqual([
      { key: 'db.statement', value: 'SELECT * FROM', negate: false },
      { key: 'status', value: 'ok', negate: true },
      { key: null, value: 'cache', negate: true },
    ])
    expect(parseFilterQuery('-')).toEqual([{ key: null, value: '-', negate: false }])
  })

  it('matches free text against name, service, id, attributes, and events', () => {
    expect(matches(span, 'select')).toBe(true)
    expect(matches(span, 'POSTGRES')).toBe(true)
    expect(matches(span, '502')).toBe(true)
    expect(matches(span, 'exception')).toBe(true)
    expect(matches(span, 'redis')).toBe(false)
  })

  it('matches keyed terms and honours negation', () => {
    expect(matches(span, 'status:error')).toBe(true)
    expect(matches(span, 'cache.hit:false')).toBe(true)
    expect(matches(span, 'user.id:null')).toBe(true)
    expect(matches(span, 'missing.key:anything')).toBe(false)
    expect(matches(span, 'select status:ok')).toBe(false)
    expect(matchTerms(span, parseFilterQuery('-select'))).toBe(false)
  })

  it('computes match ids and treats an empty query as inactive', () => {
    const other = makeSpan('span-2', null, 0, 5, { name: 'cache.get', serviceName: 'redis' })
    const index = buildTraceIndex([span, other])
    expect(computeMatchIds(index, '   ')).toBeNull()
    expect(Array.from(computeMatchIds(index, 'status:error')!)).toEqual(['span-1'])
    expect(computeMatchIds(index, 'nothing-here')!.size).toBe(0)
  })
})

describe('brush math', () => {
  const bounds: TimeWindow = [1000, 2000]

  it('converts between px and ms', () => {
    expect(msToPx(1500, bounds, 500)).toBe(250)
    expect(pxToMs(125, bounds, 500)).toBe(1250)
    expect(pxToMs(100, bounds, 0)).toBe(1000)
  })

  it('clamps windows inside bounds, preserving size and minimum duration', () => {
    expect(clampWindow([900, 1200], bounds)).toEqual([1000, 1300])
    expect(clampWindow([1800, 2100], bounds)).toEqual([1700, 2000])
    expect(clampWindow([500, 2500], bounds)).toEqual([1000, 2000])
    expect(clampWindow([1500, 1500], bounds, 100)).toEqual([1450, 1550])
    expect(clampWindow([1600, 1200], bounds)).toEqual([1200, 1600])
  })

  it('pans without resizing and stops at the edges', () => {
    expect(panWindow([1200, 1400], 100, bounds)).toEqual([1300, 1500])
    expect(panWindow([1200, 1400], 5000, bounds)).toEqual([1800, 2000])
  })

  it('resizes one edge and respects the minimum duration', () => {
    expect(resizeWindow([1200, 1600], 'start', 1300, bounds)).toEqual([1300, 1600])
    expect(resizeWindow([1200, 1600], 'start', 1700, bounds, 50)).toEqual([1550, 1600])
    expect(resizeWindow([1200, 1600], 'end', 9999, bounds)).toEqual([1200, 2000])
  })

  it('builds windows from drags and zooms around an anchor', () => {
    expect(windowFromDrag(1600, 1200, bounds)).toEqual([1200, 1600])
    expect(zoomWindow([1200, 1600], 0.5, 1400, bounds)).toEqual([1300, 1500])
    expect(zoomWindow([1200, 1600], 10, undefined, bounds)).toEqual([1000, 2000])
  })

  it('converts a window to a pixel rectangle and detects the full window', () => {
    expect(brushRect([1250, 1750], bounds, 400)).toEqual({ left: 100, width: 200 })
    expect(isFullWindow([1000, 2000], bounds)).toBe(true)
    expect(isFullWindow([1000, 1999], bounds)).toBe(false)
  })
})

describe('resolveKeyboardAction', () => {
  const index = buildTraceIndex([
    makeSpan('root', null, 0, 10),
    makeSpan('a', 'root', 1, 11),
    makeSpan('a1', 'a', 2, 12),
    makeSpan('b', 'root', 5, 15),
  ])
  const setup = (collapsed: string[] = []) => {
    const rows = flattenTree(index, new Set(collapsed), null)
    return { rows, rowIndexById: indexRowsById(rows) }
  }

  it('moves up and down and stops at the edges', () => {
    const tree = setup()
    expect(resolveKeyboardAction({ key: 'ArrowDown', ...tree, selectedId: null })).toEqual({
      type: 'select',
      id: 'root',
    })
    expect(resolveKeyboardAction({ key: 'ArrowDown', ...tree, selectedId: 'a' })).toEqual({
      type: 'select',
      id: 'a1',
    })
    expect(resolveKeyboardAction({ key: 'ArrowUp', ...tree, selectedId: 'root' })).toBeNull()
    expect(resolveKeyboardAction({ key: 'ArrowDown', ...tree, selectedId: 'b' })).toBeNull()
  })

  it('expands on ArrowRight, then moves into the node', () => {
    expect(resolveKeyboardAction({ key: 'ArrowRight', ...setup(['a']), selectedId: 'a' })).toEqual({
      type: 'expand',
      id: 'a',
    })
    expect(resolveKeyboardAction({ key: 'ArrowRight', ...setup(), selectedId: 'a' })).toEqual({
      type: 'select',
      id: 'a1',
    })
    expect(resolveKeyboardAction({ key: 'ArrowRight', ...setup(), selectedId: 'b' })).toBeNull()
  })

  it('collapses on ArrowLeft, otherwise jumps to the parent', () => {
    const tree = setup()
    expect(resolveKeyboardAction({ key: 'ArrowLeft', ...tree, selectedId: 'a' })).toEqual({
      type: 'collapse',
      id: 'a',
    })
    expect(resolveKeyboardAction({ key: 'ArrowLeft', ...tree, selectedId: 'a1' })).toEqual({
      type: 'select',
      id: 'a',
    })
    expect(resolveKeyboardAction({ key: 'ArrowLeft', ...tree, selectedId: 'b' })).toEqual({
      type: 'select',
      id: 'root',
    })
  })

  it('jumps with Home and End and ignores other keys', () => {
    const tree = setup()
    expect(resolveKeyboardAction({ key: 'Home', ...tree, selectedId: 'b' })).toEqual({
      type: 'select',
      id: 'root',
    })
    expect(resolveKeyboardAction({ key: 'End', ...tree, selectedId: 'root' })).toEqual({
      type: 'select',
      id: 'b',
    })
    expect(resolveKeyboardAction({ key: 'Enter', ...tree, selectedId: 'a' })).toBeNull()
  })
})

describe('computeBarGeometry', () => {
  const window: TimeWindow = [100, 200]

  it('positions and clips bars against the window', () => {
    expect(computeBarGeometry(125, 175, window)).toMatchObject({
      clip: 'none',
      leftFraction: 0.25,
      widthFraction: 0.5,
    })
    expect(computeBarGeometry(50, 150, window)).toMatchObject({ clip: 'start', leftFraction: 0 })
    expect(computeBarGeometry(150, 250, window)).toMatchObject({ clip: 'end', widthFraction: 0.5 })
    expect(computeBarGeometry(0, 300, window)).toMatchObject({ clip: 'both', widthFraction: 1 })
  })

  it('hides bars outside the window and flags zero duration', () => {
    expect(computeBarGeometry(0, 50, window).isVisible).toBe(false)
    expect(computeBarGeometry(150, 150, window)).toMatchObject({
      isVisible: true,
      isZeroDuration: true,
    })
    expect(computeBarGeometry(150, 140, window).isZeroDuration).toBe(true)
    expect(computeBarGeometry(100, 150, [100, 100]).isVisible).toBe(false)
  })
})

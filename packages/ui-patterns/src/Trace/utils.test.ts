import { describe, expect, it } from 'vitest'

import type { Span } from './types'
import {
  buildTraceIndex,
  createTimeScale,
  flattenTree,
  formatDuration,
  formatMs,
  niceTickStep,
} from './utils'

const span = (id: string, startMs: number, endMs: number | null, parentId: string | null = null) =>
  ({
    id,
    parentId,
    traceId: 't',
    name: id,
    startMs,
    endMs,
    status: 'ok',
    attributes: {},
    events: [],
  }) satisfies Span

describe('buildTraceIndex', () => {
  it('isLive is true only when a span has no end', () => {
    expect(buildTraceIndex([span('a', 0, 10)]).isLive).toBe(false)
    expect(buildTraceIndex([span('a', 0, 10), span('b', 5, null, 'a')]).isLive).toBe(true)
  })

  it('applies minRangeMs as a floor only while live', () => {
    const live = [span('a', 100, 110), span('b', 105, null, 'a')]
    expect(buildTraceIndex(live, 120, 500).bounds).toEqual([100, 600])
    expect(buildTraceIndex(live, 120).bounds).toEqual([100, 120])
    expect(buildTraceIndex(live, 700, 500).bounds).toEqual([100, 700])

    const finished = [span('a', 100, 110)]
    expect(buildTraceIndex(finished, undefined, 500).bounds).toEqual([100, 110])
  })

  it('slowestId ignores running spans and breaks ties by first encountered', () => {
    const spans = [span('a', 0, 10), span('b', 0, 50, 'a'), span('c', 0, null, 'a')]
    expect(buildTraceIndex(spans, 1000).slowestId).toBe('b')

    const tie = [span('a', 0, 20), span('b', 5, 25, 'a'), span('c', 0, 5, 'a')]
    expect(buildTraceIndex(tie).slowestId).toBe('a')
  })

  it('slowestId is null when no span has finished', () => {
    expect(buildTraceIndex([span('a', 0, null)]).slowestId).toBeNull()
    expect(buildTraceIndex([]).slowestId).toBeNull()
  })
})

describe('createTimeScale', () => {
  it('maps time to position and back', () => {
    const scale = createTimeScale([100, 200], 500)
    expect(scale.toX(150)).toBe(250)
    expect(scale.toFraction(200)).toBe(1)
    expect(scale.toMs(250)).toBe(150)
  })

  it('handles an empty window', () => {
    const scale = createTimeScale([5, 5], 500)
    expect(scale.toX(5)).toBe(0)
    expect(scale.toMs(100)).toBe(5)
  })
})

describe('ticks', () => {
  it('picks the smallest nice step that fits the width', () => {
    expect(niceTickStep(1000, 10)).toBe(100)
    expect(niceTickStep(1000, 3)).toBe(500)
    expect(niceTickStep(7_200_000 * 4, 2)).toBe(14_400_000)
  })

  it('formats labels with enough precision for the step', () => {
    expect(formatMs(0, 100)).toBe('0ms')
    expect(formatMs(0.5, 0.5)).toBe('500µs')
    expect(formatMs(250, 50)).toBe('250ms')
    expect(formatMs(1200, 200)).toBe('1.2s')
    expect(formatMs(2000, 1000)).toBe('2s')
    expect(formatMs(90_000, 30_000)).toBe('1m 30s')
    expect(formatMs(5_400_000, 1_800_000)).toBe('1h 30m')
  })

  it('places ticks as fractions of the window', () => {
    const { ticks } = createTimeScale([100, 1100], 800)
    expect(ticks.map((tick) => tick.label)).toEqual([
      '0ms',
      '100ms',
      '200ms',
      '300ms',
      '400ms',
      '500ms',
      '600ms',
      '700ms',
      '800ms',
      '900ms',
      '1s',
    ])
    expect(ticks[1]).toMatchObject({ ms: 200, fraction: 0.1 })
  })

  it('has no ticks for an empty window or zero width', () => {
    expect(createTimeScale([5, 5], 800).ticks).toEqual([])
    expect(createTimeScale([0, 100], 0).ticks).toEqual([])
  })
})

describe('flattenTree', () => {
  const spans = [
    span('root', 0, 100),
    span('a', 10, 50, 'root'),
    span('a1', 20, 30, 'a'),
    span('b', 60, 90, 'root'),
  ]
  const ids = (collapsed: string[] = [], input: Span[] = spans) =>
    flattenTree(buildTraceIndex(input), new Set(collapsed)).map((row) => row.span.id)

  it('orders rows depth-first by start time with depth and expansion state', () => {
    const rows = flattenTree(buildTraceIndex(spans), new Set())
    expect(rows.map((row) => [row.span.id, row.depth])).toEqual([
      ['root', 0],
      ['a', 1],
      ['a1', 2],
      ['b', 1],
    ])
    expect(rows[1]).toMatchObject({ hasChildren: true, isExpanded: true })
    expect(rows[2]).toMatchObject({ hasChildren: false, isExpanded: false })
  })

  it('hides descendants of a collapsed span', () => {
    expect(ids(['a'])).toEqual(['root', 'a', 'b'])
    expect(ids(['root'])).toEqual(['root'])
    const rows = flattenTree(buildTraceIndex(spans), new Set(['a']))
    expect(rows[1]).toMatchObject({ hasChildren: true, isExpanded: false })
  })

  it('treats a span with a missing parent as a root', () => {
    expect(ids([], [span('x', 5, 10, 'gone'), span('root', 0, 100)])).toEqual(['root', 'x'])
  })

  it('returns no rows for an empty trace', () => {
    expect(ids([], [])).toEqual([])
  })
})

describe('formatDuration', () => {
  it('keeps three significant digits', () => {
    expect(formatDuration(0)).toBe('0ms')
    expect(formatDuration(45.678)).toBe('45.7ms')
    expect(formatDuration(480)).toBe('480ms')
    expect(formatDuration(1234)).toBe('1.23s')
    expect(formatDuration(90_000)).toBe('1m 30s')
  })
})

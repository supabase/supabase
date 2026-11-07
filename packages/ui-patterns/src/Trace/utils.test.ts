import { describe, expect, it } from 'vitest'

import type { Span } from './types'
import { buildTraceIndex, createTimeScale } from './utils'

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

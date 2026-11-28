import { describe, expect, test } from 'vitest'

import { getTraceServices, getTraceStartMs, toTraceData } from './RequestTrace.utils'
import type { UnifiedLogTraceSpansData } from '@/data/logs/unified-log-trace-spans-query'

const span = ({
  id,
  parent_span_id = null,
  service_name = 'edge-runtime',
  status_code = 'ok',
  start_time = '2026-01-01T10:00:00.000Z',
  duration_ns = 1_000_000,
}: {
  id: string
  parent_span_id?: string | null
  service_name?: string
  status_code?: string
  start_time?: string
  duration_ns?: number
}): UnifiedLogTraceSpansData['data'][number] => ({
  type: 'span',
  id,
  attributes: {
    parent_span_id,
    service_name,
    span_name: `span ${id}`,
    span_kind: 'client',
    status_code,
    start_time,
    duration_ns,
  },
})

const response = (
  spans: UnifiedLogTraceSpansData['data'],
  partial = true
): UnifiedLogTraceSpansData => ({ data: spans, meta: { partial } })

describe('toTraceData', () => {
  test('converts a span to the waterfall shape', () => {
    const { trace, unplacedCount } = toTraceData('trace-1', response([span({ id: 'a' })]))
    expect(unplacedCount).toBe(0)
    expect(trace.traceId).toBe('trace-1')
    expect(trace.spans[0]).toMatchObject({
      id: 'a',
      parentId: null,
      traceId: 'trace-1',
      name: 'span a',
      startMs: Date.parse('2026-01-01T10:00:00.000Z'),
      endMs: Date.parse('2026-01-01T10:00:00.001Z'),
      status: 'ok',
      attributes: { service_name: 'edge-runtime', span_kind: 'client', status_code: 'ok' },
      events: [],
    })
  })

  test.each([
    ['ok', 'ok'],
    ['error', 'error'],
    ['unset', 'unset'],
    ['anything else', 'unset'],
  ])('maps status %s to %s', (statusCode, expected) => {
    const { trace } = toTraceData('t', response([span({ id: 'a', status_code: statusCode })]))
    expect(trace.spans[0].status).toBe(expected)
  })

  // `endMs: null` would mean "still running" and draw a bar to now; zero width is the honest shape.
  test.each([0, -5])('draws a %s ns duration as zero width rather than as running', (duration) => {
    const { trace } = toTraceData('t', response([span({ id: 'a', duration_ns: duration })]))
    expect(trace.spans[0].endMs).toBe(trace.spans[0].startMs)
  })

  test('keeps sub-millisecond precision so two close spans do not collapse onto the same start', () => {
    const { trace } = toTraceData(
      't',
      response([
        span({ id: 'a', start_time: '2026-01-01T10:00:00.1230000Z' }),
        span({ id: 'b', start_time: '2026-01-01T10:00:00.1238000Z' }),
      ])
    )
    const [a, b] = trace.spans
    expect(a.startMs).not.toBe(b.startMs)
    // float64 can't hold a full ms-scale epoch plus a sub-ms fraction to more than ~4 decimal
    // digits of precision — close enough to preserve ordering, which is the point here.
    expect(b.startMs - a.startMs).toBeCloseTo(0.8, 2)
  })

  test('passes a parent through untouched so the index can promote orphans itself', () => {
    const { trace } = toTraceData(
      't',
      response([span({ id: 'child', parent_span_id: 'sampled-away' })])
    )
    expect(trace.spans[0].parentId).toBe('sampled-away')
  })

  test('leaves out a span with an unparseable start time and counts it', () => {
    const { trace, unplacedCount } = toTraceData(
      't',
      response([span({ id: 'a' }), span({ id: 'bad', start_time: 'not a date' })])
    )
    expect(trace.spans.map((s) => s.id)).toEqual(['a'])
    expect(unplacedCount).toBe(1)
  })

  test('cuts the back-edge of a parent cycle so one span becomes a root', () => {
    const { trace } = toTraceData(
      't',
      response([span({ id: 'x', parent_span_id: 'y' }), span({ id: 'y', parent_span_id: 'x' })])
    )
    const parents = trace.spans.map((s) => s.parentId)
    expect(parents).toContain(null)
    expect(parents.filter((p) => p !== null)).toHaveLength(1)
  })

  test('keeps a genuine tree intact', () => {
    const { trace } = toTraceData(
      't',
      response([
        span({ id: 'root' }),
        span({ id: 'a', parent_span_id: 'root', start_time: '2026-01-01T10:00:00.100Z' }),
        span({ id: 'b', parent_span_id: 'a', start_time: '2026-01-01T10:00:00.200Z' }),
      ])
    )
    expect(trace.spans.map((s) => [s.id, s.parentId])).toEqual([
      ['root', null],
      ['a', 'root'],
      ['b', 'a'],
    ])
  })

  test('handles an empty trace', () => {
    expect(toTraceData('t', response([]))).toEqual({
      trace: { traceId: 't', spans: [] },
      unplacedCount: 0,
    })
  })
})

describe('getTraceStartMs', () => {
  test('is the earliest placed span', () => {
    const { trace } = toTraceData(
      't',
      response([
        span({ id: 'late', start_time: '2026-01-01T10:00:00.500Z' }),
        span({ id: 'early', start_time: '2026-01-01T10:00:00.000Z' }),
      ])
    )
    expect(getTraceStartMs(trace)).toBe(Date.parse('2026-01-01T10:00:00.000Z'))
  })

  test('is null for an empty trace', () => {
    expect(getTraceStartMs({ traceId: 't', spans: [] })).toBeNull()
  })
})

describe('getTraceServices', () => {
  test('lists each service once, sorted', () => {
    expect(
      getTraceServices([
        span({ id: '1', service_name: 'postgrest' }),
        span({ id: '2', service_name: 'auth' }),
        span({ id: '3', service_name: 'postgrest' }),
      ])
    ).toEqual(['auth', 'postgrest'])
  })

  test('handles an empty trace', () => {
    expect(getTraceServices([])).toEqual([])
  })
})

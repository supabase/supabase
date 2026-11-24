import { describe, expect, test } from 'vitest'

import type { ColumnSchema } from '../UnifiedLogs.schema'
import {
  formatDurationMs,
  formatOffsetMs,
  getLogSpanId,
  getShortTraceId,
  getSpansForLog,
  getTraceSummary,
} from './TraceSpans.utils'
import type { TraceSpan } from '@/data/logs/unified-log-trace-spans-query'

const span = ({
  id,
  parent_span_id = null,
  service_name = 'postgrest',
  start_time = '2026-01-01T10:00:00.000Z',
  duration_ns = 1_000_000,
}: {
  id: string
  parent_span_id?: string | null
  service_name?: string
  start_time?: string
  duration_ns?: number
}): TraceSpan => ({
  type: 'span',
  id,
  attributes: {
    parent_span_id,
    service_name,
    span_name: `span ${id}`,
    span_kind: 'server',
    status_code: 'ok',
    start_time,
    duration_ns,
  },
})

const log = (metadata: ColumnSchema['metadata']): ColumnSchema =>
  ({ id: 'log-1', log_type: 'edge', metadata }) as ColumnSchema

describe('getLogSpanId', () => {
  test('reads a span id from the log attributes', () => {
    expect(getLogSpanId(log({ span_id: 'span-1' }))).toEqual('span-1')
  })

  test.each([
    { name: 'no metadata', metadata: null },
    { name: 'no span id', metadata: { trace_id: 'trace-1' } },
    { name: 'an empty span id', metadata: { span_id: '' } },
    { name: 'a non-string span id', metadata: { span_id: 42 } },
  ])('returns undefined for $name', ({ metadata }) => {
    expect(getLogSpanId(log(metadata))).toBeUndefined()
  })
})

describe('getSpansForLog', () => {
  const spans = [
    span({ id: 'root' }),
    span({
      id: 'own',
      parent_span_id: 'root',
      start_time: '2026-01-01T10:00:00.100Z',
      duration_ns: 50_000_000,
    }),
    span({
      id: 'child-b',
      parent_span_id: 'own',
      service_name: 'postgres',
      start_time: '2026-01-01T10:00:00.300Z',
    }),
    span({
      id: 'child-a',
      parent_span_id: 'own',
      service_name: 'auth',
      start_time: '2026-01-01T10:00:00.150Z',
    }),
    span({ id: 'grandchild', parent_span_id: 'child-a' }),
    span({ id: 'unrelated', parent_span_id: 'root' }),
  ]

  test('returns the log span and its direct children, earliest first', () => {
    expect(getSpansForLog(spans, log({ span_id: 'own' })).map((row) => row.id)).toEqual([
      'own',
      'child-a',
      'child-b',
    ])
  })

  test('anchors offsets to the log span, so it reads as the zero point', () => {
    const rows = getSpansForLog(spans, log({ span_id: 'own' }))
    expect(rows.map((row) => row.offsetMs)).toEqual([0, 50, 200])
  })

  test('converts durations from nanoseconds', () => {
    const [own] = getSpansForLog(spans, log({ span_id: 'own' }))
    expect(own.durationMs).toEqual(50)
  })

  test('carries the service through for display', () => {
    const rows = getSpansForLog(spans, log({ span_id: 'own' }))
    expect(rows.map((row) => row.service)).toEqual(['postgrest', 'auth', 'postgres'])
  })

  test.each([
    { name: 'the log has no span id', metadata: {} },
    { name: 'the span id matches nothing', metadata: { span_id: 'missing' } },
  ])('returns nothing when $name', ({ metadata }) => {
    expect(getSpansForLog(spans, log(metadata))).toEqual([])
  })

  test('returns nothing when the span start time is unparseable', () => {
    const broken = [span({ id: 'own', start_time: 'not-a-date' })]
    expect(getSpansForLog(broken, log({ span_id: 'own' }))).toEqual([])
  })
})

describe('getTraceSummary', () => {
  test('counts spans and lists each service once, sorted', () => {
    expect(
      getTraceSummary([
        span({ id: '1', service_name: 'postgrest' }),
        span({ id: '2', service_name: 'auth' }),
        span({ id: '3', service_name: 'postgrest' }),
      ])
    ).toEqual({ spanCount: 3, services: ['auth', 'postgrest'] })
  })

  test('handles an empty trace', () => {
    expect(getTraceSummary([])).toEqual({ spanCount: 0, services: [] })
  })
})

describe('getShortTraceId', () => {
  test('shortens a full-length trace id', () => {
    expect(getShortTraceId(`${'a'.repeat(28)}bcde`)).toEqual('aaaaaaaa…bcde')
  })

  test('leaves an already-short id alone', () => {
    expect(getShortTraceId('abc123')).toEqual('abc123')
  })
})

describe('formatting', () => {
  test.each([
    { ms: 0, expected: '+0 ms' },
    { ms: 42.4, expected: '+42 ms' },
    { ms: 1500, expected: '+1.50 s' },
  ])('formats $ms ms as an offset', ({ ms, expected }) => {
    expect(formatOffsetMs(ms)).toEqual(expected)
  })

  test.each([
    { ms: 0.4, expected: '0 ms' },
    { ms: 999, expected: '999 ms' },
    { ms: 2400, expected: '2.40 s' },
  ])('formats $ms ms as a duration', ({ ms, expected }) => {
    expect(formatDurationMs(ms)).toEqual(expected)
  })
})

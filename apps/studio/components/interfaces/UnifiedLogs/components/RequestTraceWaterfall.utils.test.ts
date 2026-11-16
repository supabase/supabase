import { describe, expect, it } from 'vitest'

import { toTraceData } from './RequestTraceWaterfall.utils'
import type { UnifiedLogTraceSpansData } from '@/data/logs/unified-log-trace-spans-query'

const span = (overrides: Partial<UnifiedLogTraceSpansData['data'][number]['attributes']> = {}) =>
  ({
    type: 'span' as const,
    id: 'span-1',
    attributes: {
      parent_span_id: null,
      service_name: 'postgrest',
      span_name: 'GET /rest/v1/orders',
      span_kind: 'server',
      status_code: 'ok',
      start_time: '2026-01-01T00:00:00.000Z',
      duration_ns: 1_500_000,
      ...overrides,
    },
  }) satisfies UnifiedLogTraceSpansData['data'][number]

describe('toTraceData', () => {
  it('maps span attributes onto the Trace Span shape', () => {
    const response: UnifiedLogTraceSpansData = { data: [span()], meta: { partial: true } }

    const trace = toTraceData('trace-1', response)

    expect(trace).toEqual({
      traceId: 'trace-1',
      spans: [
        {
          id: 'span-1',
          parentId: null,
          traceId: 'trace-1',
          name: 'GET /rest/v1/orders',
          startMs: Date.parse('2026-01-01T00:00:00.000Z'),
          endMs: Date.parse('2026-01-01T00:00:00.000Z') + 1.5,
          status: 'ok',
          attributes: {
            service_name: 'postgrest',
            span_kind: 'server',
            status_code: 'ok',
          },
          events: [],
        },
      ],
    })
  })

  it('preserves a non-null parent span id', () => {
    const response: UnifiedLogTraceSpansData = {
      data: [span({ parent_span_id: 'parent-1' })],
      meta: { partial: true },
    }

    expect(toTraceData('trace-1', response).spans[0].parentId).toBe('parent-1')
  })

  it.each([
    ['error', 'error'],
    ['ok', 'ok'],
    ['unset', 'unset'],
    ['', 'unset'],
  ])('maps status_code %s to %s', (statusCode, expected) => {
    const response: UnifiedLogTraceSpansData = {
      data: [span({ status_code: statusCode })],
      meta: { partial: true },
    }

    expect(toTraceData('trace-1', response).spans[0].status).toBe(expected)
  })

  it('returns an empty span list for a trace with no spans', () => {
    const response: UnifiedLogTraceSpansData = { data: [], meta: { partial: true } }

    expect(toTraceData('trace-1', response)).toEqual({ traceId: 'trace-1', spans: [] })
  })
})

import { describe, expect, it } from 'vitest'

import { generateDemoEvents, queryDemoEvents } from './events'

const NOW = Date.parse('2026-11-17T12:00:00Z')

describe('demo log events', () => {
  const events = generateDemoEvents()

  it('generates the same events every time', () => {
    expect(generateDemoEvents()).toEqual(events)
  })

  it('covers seven days of edge requests with a recent stripe-webhook spike', () => {
    const edge = events.filter((event) => event.source === 'function_edge_logs')
    const oldest = Math.max(...edge.map((event) => event.ageMs))
    const stripeErrors = edge.filter(
      (event) =>
        event.body.metadata.function_id === 'stripe-webhook' &&
        Number(event.body.metadata.status_code) >= 500
    )
    const recent = stripeErrors.filter((event) => event.ageMs < 30 * 60_000).length
    const hourBefore = stripeErrors.filter(
      (event) => event.ageMs >= 60 * 60_000 && event.ageMs < 90 * 60_000
    ).length

    expect(oldest).toBeGreaterThan(6 * 24 * 3_600_000)
    expect(recent).toBeGreaterThan(hourBefore * 2)
  })

  it('answers a query newest first with per-minute buckets for short ranges', () => {
    const result = queryDemoEvents(events, {
      lql: 'f:function_edge_logs m.function_id:"stripe-webhook" m.status_code:>=500',
      from: new Date(NOW - 3_600_000).toISOString(),
      to: new Date(NOW).toISOString(),
      now: NOW,
    })
    if ('error' in result) throw new Error(result.error)

    expect(result.total).toBeGreaterThan(0)
    expect(result.events.length).toBeLessThanOrEqual(100)
    expect(result.events[0].timestamp >= result.events[1].timestamp).toBe(true)
    expect(result.buckets.every((bucket) => bucket.timestamp.endsWith(':00.000Z'))).toBe(true)
    expect(result.buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(result.total)
  })

  it('uses hourly buckets for long ranges', () => {
    const result = queryDemoEvents(events, {
      lql: 'f:function_edge_logs',
      from: new Date(NOW - 7 * 24 * 3_600_000).toISOString(),
      to: new Date(NOW).toISOString(),
      now: NOW,
    })
    if ('error' in result) throw new Error(result.error)

    expect(result.buckets.every((bucket) => bucket.timestamp.endsWith(':00:00.000Z'))).toBe(true)
  })

  it('needs a known source', () => {
    expect(queryDemoEvents(events, { lql: 'm.level:error', now: NOW })).toEqual({
      error: 'Name a source with f:<source>',
    })
    expect(queryDemoEvents(events, { lql: 'f:nope', now: NOW })).toEqual({
      error: 'Unknown source nope',
    })
  })
})

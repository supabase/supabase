import { describe, expect, it } from 'vitest'

import { SHARED_API_REPORT_SQL } from './SharedAPIReport.constants'

// Collapse whitespace so assertions are resilient to formatting.
const sql = (fragment: string) => fragment.replace(/\s+/g, ' ').trim()

// Locks the generated OTEL/ClickHouse SQL for each chart against accidental drift.
// (The queries are also validated end-to-end against the staging OTEL endpoint.)
describe('SHARED_API_REPORT_SQL safeSqlOtel', () => {
  it('totalRequests targets the OTEL logs table by source and buckets hourly', () => {
    const q = sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([], 'edge_logs'))
    expect(q).toContain('from logs')
    expect(q).toContain("where source = 'edge_logs'")
    expect(q).toContain('toStartOfHour(timestamp) as timestamp')
    expect(q).toContain('count() as count')
  })

  it('topRoutes selects log_attributes columns and casts status_code to int', () => {
    const q = sql(SHARED_API_REPORT_SQL.topRoutes.safeSqlOtel([], 'edge_logs'))
    expect(q).toContain("log_attributes['request.path'] as path")
    expect(q).toContain("log_attributes['request.method'] as method")
    expect(q).toContain("toInt32OrZero(log_attributes['response.status_code']) as status_code")
    expect(q).toContain('order by count desc')
    expect(q).toContain('limit 10')
  })

  it('errorCounts filters on status >= 400', () => {
    const q = sql(SHARED_API_REPORT_SQL.errorCounts.safeSqlOtel([], 'edge_logs'))
    expect(q).toContain("toInt32OrZero(log_attributes['response.status_code']) >= 400")
    expect(q).toContain('count() as count')
  })

  it('topErrorRoutes groups routes and filters on status >= 400', () => {
    const q = sql(SHARED_API_REPORT_SQL.topErrorRoutes.safeSqlOtel([], 'edge_logs'))
    expect(q).toContain("toInt32OrZero(log_attributes['response.status_code']) >= 400")
    expect(q).toContain('order by count desc')
  })

  it('responseSpeed averages origin_time as a float', () => {
    const q = sql(SHARED_API_REPORT_SQL.responseSpeed.safeSqlOtel([], 'edge_logs'))
    expect(q).toContain("avg(toFloat64OrZero(log_attributes['response.origin_time'])) as avg")
  })

  it('topSlowRoutes orders by avg origin_time', () => {
    const q = sql(SHARED_API_REPORT_SQL.topSlowRoutes.safeSqlOtel([], 'edge_logs'))
    expect(q).toContain("avg(toFloat64OrZero(log_attributes['response.origin_time'])) as avg")
    expect(q).toContain('order by avg desc')
  })

  it('networkTraffic sums content_length into MB', () => {
    const q = sql(SHARED_API_REPORT_SQL.networkTraffic.safeSqlOtel([], 'edge_logs'))
    expect(q).toContain(
      "sum(toInt64OrZero(log_attributes['request.headers.content_length'])) / 1000000 as ingress_mb"
    )
    expect(q).toContain(
      "sum(toInt64OrZero(log_attributes['response.headers.content_length'])) / 1000000 as egress_mb"
    )
  })

  it('applies the source for function_edge_logs and falls back to edge_logs otherwise', () => {
    expect(
      sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([], 'function_edge_logs'))
    ).toContain("where source = 'function_edge_logs'")
    // Unknown source falls back to edge_logs (defensive; current callers only pass the two known sources).
    expect(sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([], 'mystery'))).toContain(
      "where source = 'edge_logs'"
    )
  })

  it('appends user filters to the source predicate with AND', () => {
    const q = sql(
      SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel(
        [{ key: 'request.path', value: '/auth', compare: 'matches' }],
        'edge_logs'
      )
    )
    expect(q).toContain(
      "where source = 'edge_logs' AND match(log_attributes['request.path'], '/auth')"
    )
  })
})

import { describe, expect, it } from 'vitest'

import { ReportFilterItem } from '../Reports.types'
import { SHARED_API_REPORT_SQL } from './SharedAPIReport.constants'

const sql = (fragment: { toString(): string }) => String(fragment)

const pathFilter: ReportFilterItem = {
  key: 'request.path',
  value: '/auth',
  compare: 'matches',
}

describe('SHARED_API_REPORT_SQL safeSqlOtel', () => {
  it('queries the single OTEL logs table by source, never a per-service table', () => {
    const out = sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([]))

    expect(out).toContain('from logs')
    expect(out).toContain("where source = 'edge_logs'")
    expect(out).toContain('count() as count')
    expect(out).not.toContain('cross join unnest')
    expect(out).not.toContain('timestamp_trunc')
    expect(out).not.toContain('count(t.id)')
  })

  it('emits 16-digit unix-microsecond timestamps', () => {
    expect(sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([]))).toContain(
      'toUnixTimestamp(toStartOfHour(timestamp)) * 1000000 as timestamp'
    )
  })

  it('honors the requested source and falls back to edge_logs for unknown ones', () => {
    expect(
      sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([], 'function_edge_logs'))
    ).toContain("where source = 'function_edge_logs'")
    expect(sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([], 'made_up'))).toContain(
      "where source = 'edge_logs'"
    )
  })

  it('translates a matches filter to ClickHouse match() over log_attributes', () => {
    const out = sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([pathFilter]))
    expect(out).toContain("match(log_attributes['request.path'], '/auth')")
  })

  it('preserves value casing so uppercase HTTP methods match', () => {
    const methodFilter: ReportFilterItem = {
      key: 'request.method',
      value: 'DELETE',
      compare: 'is',
    }
    const out = sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([methodFilter]))
    expect(out).toContain("log_attributes['request.method'] = 'DELETE'")
  })

  it('preserves the full dotted key for 3-segment filters (e.g. request headers)', () => {
    const headerFilter: ReportFilterItem = {
      key: 'request.headers.x_client_info',
      value: 'supabase-js',
      compare: 'is',
    }
    const out = sql(SHARED_API_REPORT_SQL.totalRequests.safeSqlOtel([headerFilter]))
    expect(out).toContain("log_attributes['request.headers.x_client_info'] = 'supabase-js'")
    expect(out).not.toContain("log_attributes['headers.x_client_info']")
  })

  it('reads route dimensions from log_attributes with an int status_code', () => {
    const out = sql(SHARED_API_REPORT_SQL.topRoutes.safeSqlOtel([]))

    expect(out).toContain("log_attributes['request.path'] as path")
    expect(out).toContain("log_attributes['request.method'] as method")
    expect(out).toContain("log_attributes['request.search'] as search")
    expect(out).toContain("toInt32OrZero(log_attributes['response.status_code']) as status_code")
    expect(out).toContain('limit 10')
  })

  it('filters error queries by status_code >= 400', () => {
    expect(sql(SHARED_API_REPORT_SQL.errorCounts.safeSqlOtel([]))).toContain(
      "toInt32OrZero(log_attributes['response.status_code']) >= 400"
    )
    expect(sql(SHARED_API_REPORT_SQL.topErrorRoutes.safeSqlOtel([]))).toContain(
      "toInt32OrZero(log_attributes['response.status_code']) >= 400"
    )
  })

  it('averages response.origin_time for the speed queries', () => {
    expect(sql(SHARED_API_REPORT_SQL.responseSpeed.safeSqlOtel([]))).toContain(
      "avg(toFloat64OrZero(log_attributes['response.origin_time'])) as avg"
    )
    expect(sql(SHARED_API_REPORT_SQL.topSlowRoutes.safeSqlOtel([]))).toContain(
      "avg(toFloat64OrZero(log_attributes['response.origin_time'])) as avg"
    )
  })

  it('sums content_length headers into ingress/egress MB', () => {
    const out = sql(SHARED_API_REPORT_SQL.networkTraffic.safeSqlOtel([]))

    expect(out).toContain(
      "sum(toInt64OrZero(log_attributes['request.headers.content_length'])) / 1000000 as ingress_mb"
    )
    expect(out).toContain(
      "sum(toInt64OrZero(log_attributes['response.headers.content_length'])) / 1000000 as egress_mb"
    )
  })
})

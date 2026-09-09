import { describe, expect, it } from 'vitest'

import {
  API_REPORT_QUERIES_OTEL,
  generateReportFiltersOtel,
  requestsByCountryOtel,
} from './Reports.utils.otel'

const compact = (sql: string) => sql.replace(/\s+/g, ' ').trim()

describe('OTEL report filters', () => {
  it('keeps nested attributes and numeric-looking string values intact', () => {
    expect(
      generateReportFiltersOtel([
        { key: 'request.headers.x_client_info', compare: 'is', value: '001' },
        { key: 'identifier', compare: 'is', value: '0123' },
      ])
    ).toBe(
      "and log_attributes['request.headers.x_client_info'] = '001' and log_attributes['identifier'] = '0123'"
    )
  })

  it('escapes regex values and maps function paths', () => {
    expect(
      generateReportFiltersOtel(
        [{ key: 'request.path', compare: 'matches', value: "a'\\b" }],
        'function_edge_logs'
      )
    ).toBe("and match(log_attributes['request.pathname'], 'a''\\\\b')")
  })

  it.each(['>=', '<=', '>', '<', '!='] as const)(
    'compares status codes numerically with %s',
    (compare) => {
      expect(
        generateReportFiltersOtel([{ key: 'response.status_code', compare, value: '400' }])
      ).toBe(`and toFloat64OrZero(log_attributes['response.status_code']) ${compare} 400`)
    }
  )

  it('handles no filters', () => {
    expect(generateReportFiltersOtel([])).toBe('')
  })
})

describe('OTEL report queries', () => {
  it.each(Object.entries(API_REPORT_QUERIES_OTEL))('scopes and limits %s', (_, builder) => {
    const sql = compact(builder.safeSql([], 'function_edge_logs'))
    expect(sql).toContain("from logs where source = 'function_edge_logs'")
    expect(sql).toMatch(/limit \d+$/)
    expect(sql).not.toMatch(/unnest|count\(\*\)|timestamp_trunc/)
  })

  it('groups counts into hours', () => {
    expect(compact(API_REPORT_QUERIES_OTEL.totalRequests.safeSql([]))).toBe(
      "select formatDateTime(toStartOfHour(logs.timestamp), '%Y-%m-%dT%H:%i:%SZ', 'UTC') as timestamp, toFloat64(count()) as count from logs where source = 'edge_logs' group by toStartOfHour(logs.timestamp) order by timestamp asc limit 10000"
    )
  })

  it('preserves route aliases and filters error statuses numerically', () => {
    const sql = API_REPORT_QUERIES_OTEL.topErrorRoutes.safeSql([], 'function_edge_logs')
    expect(sql).toContain("log_attributes['request.pathname'] as path")
    expect(sql).toContain("toInt32OrZero(log_attributes['response.status_code']) as status_code")
    expect(sql).toContain("toInt32OrZero(log_attributes['response.status_code']) >= 400")
    expect(sql).toContain('group by path, method, search, status_code')
  })

  it('coerces timing and byte strings before aggregation', () => {
    expect(API_REPORT_QUERIES_OTEL.responseSpeed.safeSql([])).toContain(
      "avg(toFloat64OrNull(log_attributes['response.origin_time'])) as avg"
    )
    const sql = API_REPORT_QUERIES_OTEL.networkTraffic.safeSql([])
    expect(sql).toContain(
      "sum(toFloat64OrZero(log_attributes['request.headers.content_length'])) / 1000000 as ingress_mb"
    )
    expect(sql).toContain(
      "sum(toFloat64OrZero(log_attributes['response.headers.content_length'])) / 1000000 as egress_mb"
    )
  })

  it('uses the full country attribute', () => {
    expect(requestsByCountryOtel([])).toContain("log_attributes['request.cf.country'] as country")
  })
})

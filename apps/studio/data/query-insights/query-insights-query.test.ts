import { describe, expect, it } from 'vitest'

import { getQueryInsightsSqlOtel } from './query-insights-query'

describe('getQueryInsightsSqlOtel', () => {
  it('preserves the Query Insights aggregation contract in ClickHouse', () => {
    const sql = getQueryInsightsSqlOtel()
    const expectedAliases = [
      'timestamp',
      'application_name',
      'calls',
      'database_name',
      'query',
      'query_id',
      'total_exec_time',
      'total_plan_time',
      'user_name',
      'mean_exec_time',
      'min_exec_time',
      'max_exec_time',
      'mean_plan_time',
      'min_plan_time',
      'max_plan_time',
      'p50_exec_time',
      'p95_exec_time',
      'p50_plan_time',
      'p95_plan_time',
    ]
    const expectedAttributeKeys = [
      'supamonitor.application_name',
      'supamonitor.calls',
      'supamonitor.database_name',
      'supamonitor.query',
      'supamonitor.query_id',
      'supamonitor.total_exec_time',
      'supamonitor.total_plan_time',
      'supamonitor.user_name',
    ]

    expect(sql).toContain("from logs\nwhere source = 'supamonitor_logs'")
    expect(sql).toContain('toStartOfMinute(timestamp)')
    expect(sql).toContain("sum(toUInt64OrZero(log_attributes['supamonitor.calls'])) > 0")
    expect(sql).toContain('quantileTDigest(0.5)')
    expect(sql).toContain('quantileTDigest(0.95)')
    expect(sql).toContain('limit 10000')
    expect(sql).not.toMatch(/cross join|unnest|TIMESTAMP_TRUNC|APPROX_QUANTILES|count\(\*\)/i)
    expectedAttributeKeys.forEach((key) => expect(sql).toContain(`log_attributes['${key}']`))
    expectedAliases.forEach((alias) => expect(sql).toMatch(new RegExp(`as ${alias}\\b`, 'i')))
  })
})

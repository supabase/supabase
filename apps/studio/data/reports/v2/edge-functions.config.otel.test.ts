import { describe, expect, it } from 'vitest'

import { METRIC_SQL_OTEL } from './edge-functions.config'

const sql = (fragment: { toString(): string }) => String(fragment)

describe('METRIC_SQL_OTEL', () => {
  it('queries the single OTEL logs table by source, never a per-service table', () => {
    const out = sql(METRIC_SQL_OTEL.TotalInvocations('1h'))

    expect(out).toContain('from logs')
    expect(out).toContain("source = 'function_edge_logs'")
    expect(out).not.toContain('from function_edge_logs')
    expect(out).not.toContain('cross join unnest')
  })

  it('emits 16-digit unix-microsecond timestamps bucketed by granularity', () => {
    expect(sql(METRIC_SQL_OTEL.TotalInvocations('1h'))).toContain(
      'toUnixTimestamp(toStartOfHour(timestamp)) * 1000000 as timestamp'
    )
    expect(sql(METRIC_SQL_OTEL.TotalInvocations('1d'))).toContain(
      'toUnixTimestamp(toStartOfDay(timestamp)) * 1000000 as timestamp'
    )
    expect(sql(METRIC_SQL_OTEL.TotalInvocations('5m'))).toContain(
      'toUnixTimestamp(toStartOfMinute(timestamp)) * 1000000 as timestamp'
    )
  })

  it('reads function_id from log_attributes for total invocations', () => {
    const out = sql(METRIC_SQL_OTEL.TotalInvocations('1h'))
    expect(out).toContain("log_attributes['function_id'] as function_id")
    expect(out).toContain('count() as count')
  })

  it('reads response status code from log_attributes, coerced to a number', () => {
    const out = sql(METRIC_SQL_OTEL.ExecutionStatusCodes('1h'))
    expect(out).toContain("toInt32OrZero(log_attributes['response.status_code']) as status_code")
  })

  it('reads region from the response headers attribute and drops empty values', () => {
    const out = sql(METRIC_SQL_OTEL.InvocationsByRegion('1h'))
    expect(out).toContain("log_attributes['response.headers.x_sb_edge_region'] as region")
    expect(out).toContain("log_attributes['response.headers.x_sb_edge_region'] != ''")
  })

  it('averages execution_time_ms from log_attributes, coerced to a float', () => {
    const out = sql(METRIC_SQL_OTEL.ExecutionTime('1h'))
    expect(out).toContain(
      "avg(toFloat64OrZero(log_attributes['execution_time_ms'])) as avg_execution_time"
    )
  })

  it('filters by function_id list when functions filter is set', () => {
    const out = sql(METRIC_SQL_OTEL.TotalInvocations('1h', { functions: ['fn-1', 'fn-2'] } as any))
    expect(out).toContain("log_attributes['function_id'] IN ('fn-1','fn-2')")
  })

  it('applies the numeric status_code filter using toInt32OrZero', () => {
    const out = sql(
      METRIC_SQL_OTEL.ExecutionStatusCodes('1h', {
        status_code: { operator: '>=', value: 500 },
      } as any)
    )
    expect(out).toContain("AND toInt32OrZero(log_attributes['response.status_code']) >= 500")
  })

  it('applies the numeric execution_time filter using toFloat64OrZero', () => {
    const out = sql(
      METRIC_SQL_OTEL.ExecutionTime('1h', {
        execution_time: { operator: '>=', value: 100 },
      } as any)
    )
    expect(out).toContain("AND toFloat64OrZero(log_attributes['execution_time_ms']) >= 100")
  })
})

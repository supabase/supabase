import { describe, expect, it } from 'vitest'

import {
  getSupamonitorLogsQuery,
  getSupamonitorLogsQueryOtel,
} from '@/components/interfaces/QueryInsights/QueryInsights.constants'

const start = '2026-09-09T08:00:00Z'
const end = '2026-09-09T09:00:00Z'

describe('Supamonitor log queries', () => {
  it('retains BigQuery SQL for the legacy endpoint', () => {
    expect(getSupamonitorLogsQuery(start, end)).toContain('from supamonitor_logs as sml')
    expect(getSupamonitorLogsQuery(start, end)).toContain(
      "CAST('2026-09-09T08:00:00.000Z' AS TIMESTAMP)"
    )
  })

  it('preserves nested fields, decimal timings, and UTC minute buckets in ClickHouse', () => {
    const sql = getSupamonitorLogsQueryOtel(start, end)
    expect(sql).toContain("source = 'supamonitor_logs'")
    expect(sql).toContain("toFloat64OrNull(log_attributes['supamonitor.total_exec_time'])")
    expect(sql).toContain("toInt64OrZero(log_attributes['supamonitor.calls'])")
    expect(sql).toContain(
      "formatDateTime(toStartOfMinute(logs.timestamp), '%Y-%m-%dT%H:%i:%SZ', 'UTC')"
    )
    expect(sql).toContain("parseDateTime64BestEffort('2026-09-09T08:00:00.000Z')")
    expect(sql).toContain('quantile(0.95)')
    expect(sql).toContain('limit 10000')
    expect(sql).not.toContain('unnest')
  })

  it.each([getSupamonitorLogsQuery, getSupamonitorLogsQueryOtel])(
    'rejects invalid time input',
    (builder) => {
      expect(() => builder("'; drop table logs;", end)).toThrow(RangeError)
      expect(() => builder(start, '')).toThrow(RangeError)
    }
  )
})

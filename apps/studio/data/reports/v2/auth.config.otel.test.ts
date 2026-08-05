import { describe, expect, it } from 'vitest'

import { AUTH_REPORT_SQL_OTEL } from './auth.config'

const sql = (fragment: { toString(): string }) => String(fragment)

describe('AUTH_REPORT_SQL_OTEL', () => {
  it('queries the single OTEL logs table by source, never a per-service table', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.ActiveUsers('1h'))

    expect(out).toContain('from logs')
    expect(out).toContain("where source = 'auth_logs'")
    expect(out).not.toContain('from auth_logs')
    expect(out).not.toContain('cross join unnest')
  })

  it('emits 16-digit unix-microsecond timestamps bucketed by granularity', () => {
    expect(sql(AUTH_REPORT_SQL_OTEL.ActiveUsers('1h'))).toContain(
      'toUnixTimestamp(toStartOfHour(timestamp)) * 1000000 as timestamp'
    )
    expect(sql(AUTH_REPORT_SQL_OTEL.ActiveUsers('1d'))).toContain(
      'toUnixTimestamp(toStartOfDay(timestamp)) * 1000000 as timestamp'
    )
    expect(sql(AUTH_REPORT_SQL_OTEL.ActiveUsers('5m'))).toContain(
      'toUnixTimestamp(toStartOfMinute(timestamp)) * 1000000 as timestamp'
    )
  })

  it('groups and orders by the full bucket expression, not the timestamp alias', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.ActiveUsers('1h'))

    expect(out).toContain('group by toUnixTimestamp(toStartOfHour(timestamp)) * 1000000')
    expect(out).toContain('order by toUnixTimestamp(toStartOfHour(timestamp)) * 1000000 desc')
    expect(out).not.toContain('group by timestamp')
    expect(out).not.toContain('order by timestamp desc')
  })

  it('reads auth_logs fields from the raw JSON event_message, not BigQuery json_value', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.ActiveUsers('1h'))

    expect(out).toContain("JSONExtractString(event_message, 'auth_event', 'action')")
    expect(out).toContain(
      "count(distinct JSONExtractString(event_message, 'auth_event', 'actor_id')) as count"
    )
    expect(out).not.toContain('json_value')
    expect(out).not.toContain('timestamp_trunc')
    expect(out).not.toContain('count(*)')
  })

  it('groups by provider only when a provider filter is set', () => {
    const withProvider = sql(AUTH_REPORT_SQL_OTEL.ActiveUsers('1h', { provider: ['google'] }))
    expect(withProvider).toContain(
      "coalesce(nullIf(JSONExtractString(event_message, 'provider'), ''), 'unknown') as provider"
    )
    expect(withProvider).toContain("JSONExtractString(event_message, 'provider') IN ('google')")

    const withoutProvider = sql(AUTH_REPORT_SQL_OTEL.ActiveUsers('1h'))
    expect(withoutProvider).not.toContain('as provider')
  })

  it('translates the sign-in metering predicate and login_type_provider concat', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.SignInAttempts('1h'))

    expect(out).toContain("JSONExtractString(event_message, 'action') = 'login'")
    expect(out).toContain("JSONExtractString(event_message, 'metering') = 'true'")
    expect(out).toContain('as login_type_provider')
    expect(out).toContain('concat(')
  })

  it('uses ClickHouse quantile() for percentiles over the duration field', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.SignInProcessingTimePercentiles('1h'))

    expect(out).toContain(
      "round(quantile(0.5)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p50_processing_time_ms"
    )
    expect(out).toContain('quantile(0.95)')
    expect(out).toContain('quantile(0.99)')
    expect(out).not.toContain('approx_quantiles')
  })

  it('filters TotalSignUps/PasswordResetRequests to their respective auth_event actions', () => {
    expect(sql(AUTH_REPORT_SQL_OTEL.TotalSignUps('1h'))).toContain(
      "JSONExtractString(event_message, 'auth_event', 'action') = 'user_signedup'"
    )
    expect(sql(AUTH_REPORT_SQL_OTEL.PasswordResetRequests('1h'))).toContain(
      "JSONExtractString(event_message, 'auth_event', 'action') = 'user_recovery_requested'"
    )
  })

  it('uses ClickHouse quantile() for sign-up percentiles over the duration field', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.SignUpProcessingTimePercentiles('1h'))

    expect(out).toContain(
      "round(quantile(0.5)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p50_processing_time_ms"
    )
    expect(out).toContain('quantile(0.95)')
    expect(out).toContain('quantile(0.99)')
    expect(out).not.toContain('approx_quantiles')
  })

  it('averages sign-in processing time without percentiles for the basic variant', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.SignInProcessingTimeBasic('1h'))

    expect(out).toContain("JSONExtractString(event_message, 'auth_event', 'action') = 'login'")
    expect(out).toContain(
      "round(avg(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as avg_processing_time_ms"
    )
    expect(out).not.toContain('quantile(')
  })

  it('averages sign-up processing time without percentiles for the basic variant', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.SignUpProcessingTimeBasic('1h'))

    expect(out).toContain(
      "round(avg(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as avg_processing_time_ms"
    )
    expect(out).not.toContain('quantile(')
  })

  it('reads edge_logs error fields from log_attributes', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.ErrorsByStatus('1h'))

    expect(out).toContain("where source = 'edge_logs'")
    expect(out).toContain("log_attributes['request.path'] like '%auth/v1%'")
    expect(out).toContain(
      "toInt32OrZero(log_attributes['response.status_code']) between 400 and 599"
    )
    expect(out).toContain("toInt32OrZero(log_attributes['response.status_code']) as status_code")
  })

  it('selects the x_sb_error_code attribute for the by-code breakdown', () => {
    expect(sql(AUTH_REPORT_SQL_OTEL.ErrorsByAuthCode('1h'))).toContain(
      "log_attributes['response.headers.x_sb_error_code'] as error_code"
    )
  })

  it('applies the numeric status_code filter to edge_logs error queries', () => {
    const out = sql(
      AUTH_REPORT_SQL_OTEL.ErrorsByStatus('1h', { status_code: { operator: '>=', value: 500 } })
    )
    expect(out).toContain("AND toInt32OrZero(log_attributes['response.status_code']) >= 500")
  })

  it('ignores a status_code filter on auth_logs-sourced queries (no HTTP response fields there)', () => {
    const out = sql(
      AUTH_REPORT_SQL_OTEL.ActiveUsers('1h', { status_code: { operator: '>=', value: 500 } })
    )
    expect(out).not.toContain("toInt32OrZero(log_attributes['response.status_code'])")
  })

  it('ignores a provider filter on edge_logs-sourced queries (no auth provider attribute there)', () => {
    const out = sql(AUTH_REPORT_SQL_OTEL.ErrorsByStatus('1h', { provider: ['google'] }))
    expect(out).not.toContain("JSONExtractString(event_message, 'provider')")
  })
})

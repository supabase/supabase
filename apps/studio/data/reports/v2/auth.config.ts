import { AUTH_ERROR_CODES } from 'common/constants/auth-error-codes'
import z from 'zod'

import { ReportConfig, ReportDataProviderAttribute } from './reports.types'
import {
  extractStatusCodesFromData,
  generateStatusCodeAttributes,
  transformCategoricalCountData,
  transformStatusCodeData,
} from '@/components/interfaces/Reports/Reports.utils'
import { NumericFilter } from '@/components/interfaces/Reports/v2/ReportsNumericFilter'
import type { AnalyticsInterval } from '@/data/analytics/constants'
import {
  analyticsLiteral,
  joinSqlFragments,
  safeSql,
  type SafeLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'
import {
  analyticsIntervalToGranularity,
  fetchLogs,
  SAFE_COMPARISON_OPERATOR_SQL,
  SAFE_GRANULARITY_SQL,
  type Granularity,
} from '@/data/reports/report.utils'

const AUTH_ERROR_CODE_LIST = Object.entries(AUTH_ERROR_CODES).map(([key, value]) => ({
  key,
  description: value.description,
}))

const METRIC_KEYS = [
  'ActiveUsers',
  'SignInAttempts',
  'PasswordResetRequests',
  'TotalSignUps',
  'SignInProcessingTimeBasic',
  'SignInProcessingTimePercentiles',
  'SignUpProcessingTimeBasic',
  'SignUpProcessingTimePercentiles',
  'ErrorsByStatus',
  'ErrorsByAuthCode',
]

type MetricKey = (typeof METRIC_KEYS)[number]

type AuthReportFilters = {
  status_code?: NumericFilter | null
  provider?: string[] | null
}

// Static SELECT-clause fragment for the `auth_logs` table.
const PROVIDER_SELECT_FRAGMENT = safeSql`COALESCE(JSON_VALUE(event_message, "$.provider"), 'unknown') as provider,`

// Static SELECT-clause fragment for the aliased `auth_logs f` form.
const PROVIDER_SELECT_FRAGMENT_F_ALIAS = safeSql`COALESCE(JSON_VALUE(f.event_message, "$.provider"), 'unknown') as provider,`

const PROVIDER_GROUP_BY_FRAGMENT = safeSql`, provider`
const EMPTY = safeSql``

function providerSelectFragment(groupByProvider: boolean, aliased: boolean): SafeLogSqlFragment {
  if (!groupByProvider) return EMPTY
  return aliased ? PROVIDER_SELECT_FRAGMENT_F_ALIAS : PROVIDER_SELECT_FRAGMENT
}

function providerGroupBy(groupByProvider: boolean): SafeLogSqlFragment {
  return groupByProvider ? PROVIDER_GROUP_BY_FRAGMENT : EMPTY
}

/**
 * Builds an `AND`-prefixed predicate fragment for `auth_logs`-shaped queries.
 * Returns the empty fragment when no filters apply. The returned value can be
 * spliced directly after a query's existing `WHERE` clause.
 */
function authFiltersToAndPredicates(filters?: AuthReportFilters): SafeLogSqlFragment {
  const predicates: SafeLogSqlFragment[] = []

  if (filters?.status_code) {
    const op = SAFE_COMPARISON_OPERATOR_SQL[filters.status_code.operator]
    predicates.push(
      safeSql`response.status_code ${op} ${analyticsLiteral(filters.status_code.value)}`
    )
  }

  if (filters?.provider && filters.provider.length > 0) {
    const list = joinSqlFragments(filters.provider.map(analyticsLiteral), ', ')
    predicates.push(safeSql`JSON_VALUE(event_message, "$.provider") IN (${list})`)
  }

  if (predicates.length === 0) return EMPTY
  return safeSql`AND ${joinSqlFragments(predicates, ' AND ')}`
}

/**
 * Builds an `AND`-prefixed predicate fragment for `edge_logs`-shaped queries.
 */
function edgeLogsFiltersToAndPredicates(filters?: AuthReportFilters): SafeLogSqlFragment {
  const predicates: SafeLogSqlFragment[] = []

  if (filters?.status_code) {
    const op = SAFE_COMPARISON_OPERATOR_SQL[filters.status_code.operator]
    predicates.push(
      safeSql`response.status_code ${op} ${analyticsLiteral(filters.status_code.value)}`
    )
  }

  if (predicates.length === 0) return EMPTY
  return safeSql`AND ${joinSqlFragments(predicates, ' AND ')}`
}

const AUTH_REPORT_SQL: Record<
  MetricKey,
  (interval: AnalyticsInterval, filters?: AuthReportFilters) => SafeLogSqlFragment
> = {
  ActiveUsers: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = authFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --active-users
        select
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${providerSelectFragment(groupByProvider, true)}
          count(distinct json_value(f.event_message, "$.auth_event.actor_id")) as count
        from auth_logs f
        where json_value(f.event_message, "$.auth_event.action") in (
          'login', 'user_signedup', 'token_refreshed', 'user_modified',
          'user_recovery_requested', 'user_reauthenticate_requested'
        )
        ${andPredicates}
        group by timestamp${providerGroupBy(groupByProvider)}
        order by timestamp desc${providerGroupBy(groupByProvider)}
      `
  },
  SignInAttempts: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = authFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --sign-in-attempts
        SELECT
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${providerSelectFragment(groupByProvider, false)}
          CASE
            WHEN JSON_VALUE(event_message, "$.provider") IS NOT NULL
                AND JSON_VALUE(event_message, "$.provider") != ''
            THEN CONCAT(
              JSON_VALUE(event_message, "$.login_method"),
              ' (',
              JSON_VALUE(event_message, "$.provider"),
              ')'
            )
            ELSE JSON_VALUE(event_message, "$.login_method")
          END as login_type_provider,
          COUNT(*) as count
        FROM
          auth_logs
        WHERE
          JSON_VALUE(event_message, "$.action") = 'login'
          AND JSON_VALUE(event_message, "$.metering") = "true"
          ${andPredicates}
        GROUP BY
          timestamp, login_type_provider${providerGroupBy(groupByProvider)}
        ORDER BY
          timestamp desc, login_type_provider${providerGroupBy(groupByProvider)}
      `
  },
  PasswordResetRequests: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = authFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --password-reset-requests
        select
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${providerSelectFragment(groupByProvider, true)}
          count(*) as count
        from auth_logs f
        where json_value(f.event_message, "$.auth_event.action") = 'user_recovery_requested'
        ${andPredicates}
        group by timestamp${providerGroupBy(groupByProvider)}
        order by timestamp desc${providerGroupBy(groupByProvider)}
      `
  },
  TotalSignUps: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = authFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --total-signups
        select
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${providerSelectFragment(groupByProvider, false)}
          count(*) as count
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'user_signedup'
        ${andPredicates}
        group by timestamp${providerGroupBy(groupByProvider)}
        order by timestamp desc${providerGroupBy(groupByProvider)}
      `
  },
  SignInProcessingTimeBasic: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = authFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --signin-processing-time-basic
        select
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${providerSelectFragment(groupByProvider, false)}
          count(*) as count,
          round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_processing_time_ms,
          round(min(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as min_processing_time_ms,
          round(max(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as max_processing_time_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'login'
        ${andPredicates}
        group by timestamp${providerGroupBy(groupByProvider)}
        order by timestamp desc${providerGroupBy(groupByProvider)}
      `
  },
  SignInProcessingTimePercentiles: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = authFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --signin-processing-time-percentiles
        select
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${providerSelectFragment(groupByProvider, false)}
          count(*) as count,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(50)] / 1000000, 2) as p50_processing_time_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(95)] / 1000000, 2) as p95_processing_time_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(99)] / 1000000, 2) as p99_processing_time_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'login'
        ${andPredicates}
        group by timestamp${providerGroupBy(groupByProvider)}
        order by timestamp desc${providerGroupBy(groupByProvider)}
      `
  },
  SignUpProcessingTimeBasic: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = authFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --signup-processing-time-basic
        select
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${providerSelectFragment(groupByProvider, false)}
          count(*) as count,
          round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_processing_time_ms,
          round(min(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as min_processing_time_ms,
          round(max(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as max_processing_time_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'user_signedup'
        ${andPredicates}
        group by timestamp${providerGroupBy(groupByProvider)}
        order by timestamp desc${providerGroupBy(groupByProvider)}
      `
  },
  SignUpProcessingTimePercentiles: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = authFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --signup-processing-time-percentiles
        select
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${providerSelectFragment(groupByProvider, false)}
          count(*) as count,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(50)] / 1000000, 2) as p50_processing_time_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(95)] / 1000000, 2) as p95_processing_time_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(99)] / 1000000, 2) as p99_processing_time_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'user_signedup'
        ${andPredicates}
        group by timestamp${providerGroupBy(groupByProvider)}
        order by timestamp desc${providerGroupBy(groupByProvider)}
      `
  },
  ErrorsByStatus: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = edgeLogsFiltersToAndPredicates(filters)
    return safeSql`
        --auth-errors-by-status
  select
    timestamp_trunc(timestamp, ${granularity}) as timestamp,
    count(*) as count,
    response.status_code
  from edge_logs
    cross join unnest(metadata) as m
    cross join unnest(m.request) as request
    cross join unnest(m.response) as response
    cross join unnest(response.headers) as h
  where path like '%auth/v1%'
    and response.status_code >= 400 and response.status_code <= 599
    ${andPredicates}
  group by timestamp, status_code
  order by timestamp desc
      `
  },
  ErrorsByAuthCode: (interval, filters) => {
    const granularity = SAFE_GRANULARITY_SQL[analyticsIntervalToGranularity(interval)]
    const andPredicates = edgeLogsFiltersToAndPredicates(filters)
    return safeSql`
        --auth-errors-by-code
  select
    timestamp_trunc(timestamp, ${granularity}) as timestamp,
    count(*) as count,
    h.x_sb_error_code as error_code
  from edge_logs
    cross join unnest(metadata) as m
    cross join unnest(m.request) as request
    cross join unnest(m.response) as response
    cross join unnest(response.headers) as h
  where path like '%auth/v1%'
    and response.status_code >= 400 and response.status_code <= 599
    ${andPredicates}
  group by timestamp, error_code
  order by timestamp desc
      `
  },
}

// fillTimeseries/isUnixMicro expects a 16-digit unix-microsecond timestamp, matching BigQuery's timestamp_trunc.
const OTEL_TIMESTAMP: Record<Granularity, SafeLogSqlFragment> = {
  minute: safeSql`toUnixTimestamp(toStartOfMinute(timestamp)) * 1000000`,
  hour: safeSql`toUnixTimestamp(toStartOfHour(timestamp)) * 1000000`,
  day: safeSql`toUnixTimestamp(toStartOfDay(timestamp)) * 1000000`,
}

const PROVIDER_SELECT_FRAGMENT_OTEL = safeSql`coalesce(nullIf(JSONExtractString(event_message, 'provider'), ''), 'unknown') as provider,`

function providerSelectFragmentOtel(groupByProvider: boolean): SafeLogSqlFragment {
  return groupByProvider ? PROVIDER_SELECT_FRAGMENT_OTEL : EMPTY
}

/**
 * Builds an `AND`-prefixed predicate fragment for `auth_logs`-sourced OTEL queries.
 * Deliberately ignores `status_code`: auth_logs rows have no HTTP response fields,
 * so `log_attributes['response.status_code']` would always be empty for them.
 */
function authOtelFiltersToAndPredicates(filters?: AuthReportFilters): SafeLogSqlFragment {
  if (filters?.provider && filters.provider.length > 0) {
    const list = joinSqlFragments(filters.provider.map(analyticsLiteral), ', ')
    return safeSql`AND JSONExtractString(event_message, 'provider') IN (${list})`
  }
  return EMPTY
}

/**
 * Builds an `AND`-prefixed predicate fragment for `edge_logs`-sourced OTEL queries.
 * Deliberately ignores `provider`: edge_logs rows carry no auth provider attribute.
 */
function edgeLogsOtelFiltersToAndPredicates(filters?: AuthReportFilters): SafeLogSqlFragment {
  if (filters?.status_code) {
    const op = SAFE_COMPARISON_OPERATOR_SQL[filters.status_code.operator]
    return safeSql`AND toInt32OrZero(log_attributes['response.status_code']) ${op} ${analyticsLiteral(filters.status_code.value)}`
  }
  return EMPTY
}

export const AUTH_REPORT_SQL_OTEL: Record<
  MetricKey,
  (interval: AnalyticsInterval, filters?: AuthReportFilters) => SafeLogSqlFragment
> = {
  ActiveUsers: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = authOtelFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --active-users (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragmentOtel(groupByProvider)}
          count(distinct JSONExtractString(event_message, 'auth_event', 'actor_id')) as count
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') in (
            'login', 'user_signedup', 'token_refreshed', 'user_modified',
            'user_recovery_requested', 'user_reauthenticate_requested'
          )
        ${andPredicates}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignInAttempts: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = authOtelFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --sign-in-attempts (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragmentOtel(groupByProvider)}
          case
            when JSONExtractString(event_message, 'provider') != ''
            then concat(
              JSONExtractString(event_message, 'login_method'),
              ' (',
              JSONExtractString(event_message, 'provider'),
              ')'
            )
            else JSONExtractString(event_message, 'login_method')
          end as login_type_provider,
          count() as count
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'action') = 'login'
          and JSONExtractString(event_message, 'metering') = 'true'
        ${andPredicates}
        group by ${ts}, login_type_provider${providerGroupBy(groupByProvider)}
        order by ${ts} desc, login_type_provider${providerGroupBy(groupByProvider)}
      `
  },
  PasswordResetRequests: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = authOtelFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --password-reset-requests (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragmentOtel(groupByProvider)}
          count() as count
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'user_recovery_requested'
        ${andPredicates}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  TotalSignUps: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = authOtelFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --total-signups (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragmentOtel(groupByProvider)}
          count() as count
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'user_signedup'
        ${andPredicates}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignInProcessingTimeBasic: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = authOtelFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --signin-processing-time-basic (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragmentOtel(groupByProvider)}
          count() as count,
          round(avg(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as avg_processing_time_ms,
          round(min(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as min_processing_time_ms,
          round(max(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as max_processing_time_ms
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'login'
        ${andPredicates}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignInProcessingTimePercentiles: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = authOtelFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --signin-processing-time-percentiles (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragmentOtel(groupByProvider)}
          count() as count,
          round(quantile(0.5)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p50_processing_time_ms,
          round(quantile(0.95)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p95_processing_time_ms,
          round(quantile(0.99)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p99_processing_time_ms
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'login'
        ${andPredicates}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignUpProcessingTimeBasic: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = authOtelFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --signup-processing-time-basic (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragmentOtel(groupByProvider)}
          count() as count,
          round(avg(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as avg_processing_time_ms,
          round(min(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as min_processing_time_ms,
          round(max(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as max_processing_time_ms
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'user_signedup'
        ${andPredicates}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignUpProcessingTimePercentiles: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = authOtelFiltersToAndPredicates(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return safeSql`
        --signup-processing-time-percentiles (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragmentOtel(groupByProvider)}
          count() as count,
          round(quantile(0.5)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p50_processing_time_ms,
          round(quantile(0.95)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p95_processing_time_ms,
          round(quantile(0.99)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p99_processing_time_ms
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'user_signedup'
        ${andPredicates}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  ErrorsByStatus: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = edgeLogsOtelFiltersToAndPredicates(filters)
    return safeSql`
        --auth-errors-by-status (otel)
        select
          ${ts} as timestamp,
          count() as count,
          toInt32OrZero(log_attributes['response.status_code']) as status_code
        from logs
        where source = 'edge_logs'
          and log_attributes['request.path'] like '%auth/v1%'
          and toInt32OrZero(log_attributes['response.status_code']) between 400 and 599
        ${andPredicates}
        group by ${ts}, status_code
        order by ${ts} desc
      `
  },
  ErrorsByAuthCode: (interval, filters) => {
    const ts = OTEL_TIMESTAMP[analyticsIntervalToGranularity(interval)]
    const andPredicates = edgeLogsOtelFiltersToAndPredicates(filters)
    return safeSql`
        --auth-errors-by-code (otel)
        select
          ${ts} as timestamp,
          count() as count,
          log_attributes['response.headers.x_sb_error_code'] as error_code
        from logs
        where source = 'edge_logs'
          and log_attributes['request.path'] like '%auth/v1%'
          and toInt32OrZero(log_attributes['response.status_code']) between 400 and 599
        ${andPredicates}
        group by ${ts}, error_code
        order by ${ts} desc
      `
  },
}

/**
 * Transforms raw analytics data into a chart-ready format by ensuring data consistency and completeness.
 *
 * This function addresses several key requirements for chart rendering:
 * 1. Fills missing timestamps with zero values to prevent gaps in charts
 * 2. Creates a consistent data structure with `period_start` as the time axis
 * 3. Initializes all chart attributes to 0, then populates actual values
 * 4. Sorts timestamps chronologically for proper chart ordering
 *
 * @param rawData - Raw analytics data from backend queries containing timestamp and count fields
 * @param attributes - Chart attribute configuration defining what metrics to display
 * @returns Formatted data object with consistent time series data and chart attributes
 */
export function defaultAuthReportFormatter(
  rawData: unknown,
  attributes: ReportDataProviderAttribute[],
  groupByProvider = false
) {
  const chartAttributes = attributes

  const rawDataSchema = z.object({
    result: z.array(
      z
        .object({
          timestamp: z.coerce.number(),
        })
        .catchall(z.any())
    ),
  })

  const parsedRawData = rawDataSchema.parse(rawData)
  const result = parsedRawData.result

  if (!result) return { data: undefined, chartAttributes }

  if (groupByProvider) {
    // Group by provider - create separate attributes for each provider
    const providers = new Set<string>()
    result.forEach((p: any) => {
      if (p.provider) {
        providers.add(p.provider)
      }
    })

    const providerAttributes: ReportDataProviderAttribute[] = []
    providers.forEach((provider) => {
      chartAttributes.forEach((attr) => {
        providerAttributes.push({
          ...attr,
          attribute: `${attr.attribute}_${provider}`,
          label: `${attr.label} (${provider})`,
        })
      })
    })

    const timestamps = new Set<string>(result.map((p: any) => String(p.timestamp)))
    const data = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { timestamp }
        providerAttributes.forEach((attr) => {
          point[attr.attribute] = 0
        })
        const matchingPoints = result.filter((p: any) => String(p.timestamp) === timestamp)

        matchingPoints.forEach((p: any) => {
          providerAttributes.forEach((attr) => {
            const baseAttribute = attr.attribute.split('_').slice(0, -1).join('_')
            const provider = attr.attribute.split('_').slice(-1)[0]

            if (p.provider !== provider) return

            const valueFromField =
              typeof p[baseAttribute] === 'number'
                ? p[baseAttribute]
                : typeof p.count === 'number'
                  ? p.count
                  : undefined

            if (typeof valueFromField === 'number') {
              point[attr.attribute] = (point[attr.attribute] ?? 0) + valueFromField
            }
          })
        })
        return point
      })
    return { data, chartAttributes: providerAttributes }
  } else {
    // Original logic for non-provider grouping
    const timestamps = new Set<string>(result.map((p: any) => String(p.timestamp)))
    const data = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { timestamp }
        chartAttributes.forEach((attr) => {
          point[attr.attribute] = 0
        })
        const matchingPoints = result.filter((p: any) => String(p.timestamp) === timestamp)

        matchingPoints.forEach((p: any) => {
          chartAttributes.forEach((attr) => {
            // Optional dimension filters used by some reports
            if ('login_type_provider' in (attr as any)) {
              if (p.login_type_provider !== (attr as any).login_type_provider) return
            }
            if ('providerType' in (attr as any)) {
              if (p.provider !== (attr as any).providerType) return
            }

            const valueFromField =
              typeof p[attr.attribute] === 'number'
                ? p[attr.attribute]
                : typeof p.count === 'number'
                  ? p.count
                  : undefined

            if (typeof valueFromField === 'number') {
              point[attr.attribute] = (point[attr.attribute] ?? 0) + valueFromField
            }
          })
        })
        return point
      })
    return { data, chartAttributes }
  }
}

export const createUsageReportConfig = ({
  projectRef,
  startDate,
  endDate,
  interval,
  filters,
  useOtel = false,
}: {
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  filters: AuthReportFilters
  useOtel?: boolean
}): ReportConfig<AuthReportFilters>[] => {
  const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
  const sqlSet = useOtel ? AUTH_REPORT_SQL_OTEL : AUTH_REPORT_SQL

  return [
    {
      id: 'active-user',
      label: 'Auth Activity', // https://supabase.slack.com/archives/C08N7894QTG/p1761210058358439?thread_ts=1761147906.491599&cid=C08N7894QTG
      valuePrecision: 0,
      hide: false,
      showTooltip: true,
      showLegend: false,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip:
        "Users who generated any Auth event in this period. This metric tracks authentication activity, not total product usage. Some active users won't appear here if their session stayed valid.",
      dataProvider: async () => {
        const attributes = [
          { attribute: 'ActiveUsers', provider: 'logs', label: 'Auth Activity', enabled: true },
        ]

        const sql = sqlSet.ActiveUsers(interval, filters)

        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)

        const transformedData = defaultAuthReportFormatter(rawData, attributes, groupByProvider)

        return {
          data: transformedData.data,
          attributes: transformedData.chartAttributes,
          query: sql,
        }
      },
    },
    {
      id: 'sign-in-attempts',
      label: 'Sign In Attempts by Type',
      valuePrecision: 0,
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip: 'The total number of sign in attempts by type.',
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'SignInAttempts',
            provider: 'logs',
            label: 'Password',
            login_type_provider: 'password',
            enabled: true,
          },
          {
            attribute: 'SignInAttempts',
            provider: 'logs',
            label: 'PKCE',
            login_type_provider: 'pkce',
            enabled: true,
          },
          {
            attribute: 'SignInAttempts',
            provider: 'logs',
            label: 'Refresh Token',
            login_type_provider: 'token',
            enabled: true,
          },
          {
            attribute: 'SignInAttempts',
            provider: 'logs',
            label: 'ID Token',
            login_type_provider: 'id_token',
            enabled: true,
          },
        ]

        const sql = sqlSet.SignInAttempts(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)
        const transformedData = defaultAuthReportFormatter(rawData, attributes, groupByProvider)

        return {
          data: transformedData.data,
          attributes: transformedData.chartAttributes,
          query: sql,
        }
      },
    },
    {
      id: 'signups',
      label: 'Sign Ups',
      valuePrecision: 0,
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip: 'The total number of sign ups.',
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'TotalSignUps',
            provider: 'logs',
            label: 'Sign Ups',
            enabled: true,
          },
        ]

        const sql = sqlSet.TotalSignUps(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)
        const transformedData = defaultAuthReportFormatter(rawData, attributes, groupByProvider)

        return {
          data: transformedData.data,
          attributes: transformedData.chartAttributes,
          query: sql,
        }
      },
    },
    {
      id: 'password-reset-requests',
      label: 'Password Reset Requests',
      valuePrecision: 0,
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip: 'The total number of password reset requests.',
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'PasswordResetRequests',
            provider: 'logs',
            label: 'Password Reset Requests',
            enabled: true,
          },
        ]

        const sql = sqlSet.PasswordResetRequests(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)
        const transformedData = defaultAuthReportFormatter(rawData, attributes, groupByProvider)

        return {
          data: transformedData.data,
          attributes: transformedData.chartAttributes,
          query: sql,
        }
      },
    },
  ]
}

export const createErrorsReportConfig = ({
  projectRef,
  startDate,
  endDate,
  interval,
  filters,
  useOtel = false,
}: {
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  filters: AuthReportFilters
  useOtel?: boolean
}): ReportConfig<AuthReportFilters>[] => {
  const sqlSet = useOtel ? AUTH_REPORT_SQL_OTEL : AUTH_REPORT_SQL
  return [
    {
      id: 'auth-errors',
      label: 'API Gateway Auth Errors',
      valuePrecision: 0,
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip: 'The total number of auth errors by status code from the API Gateway.',
      dataProvider: async () => {
        const sql = sqlSet.ErrorsByStatus(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)

        if (!rawData?.result) return { data: [], query: sql }

        const statusCodes = extractStatusCodesFromData(rawData.result)
        const attributes = generateStatusCodeAttributes(statusCodes)
        const data = transformStatusCodeData(rawData.result, statusCodes)

        return { data, attributes, query: sql }
      },
    },
    {
      id: 'auth-errors-by-code',
      label: 'Auth Errors by Code',
      valuePrecision: 0,
      hide: false,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip:
        'The total number of auth errors by Supabase Auth error code from the API Gateway.',
      dataProvider: async () => {
        const sql = sqlSet.ErrorsByAuthCode(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)

        if (!rawData?.result) return { data: [], query: sql }

        const rows = z
          .array(z.object({ error_code: z.string().nullish() }).catchall(z.unknown()))
          .parse(rawData.result)

        const categories = rows
          .map((r) => r.error_code)
          .filter((v): v is string => v !== null && v !== undefined)
        const distinct = Array.from(new Set(categories)).sort()

        const attributes = distinct.map((c: string) => ({
          attribute: c,
          label: c,
          tooltip: AUTH_ERROR_CODE_LIST.find((e) => e.key === c)?.description,
        }))

        const pivoted = transformCategoricalCountData(rows, 'error_code', distinct)

        return { data: pivoted, attributes, query: sql }
      },
    },
  ]
}

export const createLatencyReportConfig = ({
  projectRef,
  startDate,
  endDate,
  interval,
  filters,
  useOtel = false,
}: {
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  filters: AuthReportFilters
  useOtel?: boolean
}): ReportConfig<AuthReportFilters>[] => {
  const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
  const sqlSet = useOtel ? AUTH_REPORT_SQL_OTEL : AUTH_REPORT_SQL

  return [
    {
      id: 'sign-in-processing-time-basic',
      label: 'Sign In Processing Time',
      valuePrecision: 2,
      hide: false,
      hideHighlightedValue: true,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip:
        'Basic processing time metrics for sign in operations within the auth server (excludes network latency).',
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'avg_processing_time_ms',
            label: 'Avg. Processing Time (ms)',
          },
          {
            attribute: 'min_processing_time_ms',
            label: 'Min. Processing Time (ms)',
          },
          {
            attribute: 'max_processing_time_ms',
            label: 'Max. Processing Time (ms)',
          },
        ]

        const sql = sqlSet.SignInProcessingTimeBasic(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)
        const transformedData = defaultAuthReportFormatter(rawData, attributes, groupByProvider)

        return {
          data: transformedData.data,
          attributes: transformedData.chartAttributes,
          query: sql,
        }
      },
    },
    {
      id: 'sign-in-processing-time-percentiles',
      label: 'Sign In Processing Time Percentiles',
      valuePrecision: 2,
      hide: false,
      hideHighlightedValue: true,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip:
        'Percentile processing time metrics for sign in operations within the auth server (excludes network latency).',
      entitlement: 'auth',
      requiredPlan: 'Pro',
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'p50_processing_time_ms',
            label: 'P50 Processing Time (ms)',
          },
          {
            attribute: 'p95_processing_time_ms',
            label: 'P95 Processing Time (ms)',
          },
          {
            attribute: 'p99_processing_time_ms',
            label: 'P99 Processing Time (ms)',
          },
        ]

        const sql = sqlSet.SignInProcessingTimePercentiles(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)
        const transformedData = defaultAuthReportFormatter(rawData, attributes, groupByProvider)

        return {
          data: transformedData.data,
          attributes: transformedData.chartAttributes,
          query: sql,
        }
      },
    },
    {
      id: 'sign-up-processing-time-basic',
      label: 'Sign Up Processing Time',
      valuePrecision: 2,
      hide: false,
      hideHighlightedValue: true,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip:
        'Basic processing time metrics for sign up operations within the auth server (excludes network latency).',
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'avg_processing_time_ms',
            label: 'Avg. Processing Time (ms)',
          },
          {
            attribute: 'min_processing_time_ms',
            label: 'Min. Processing Time (ms)',
          },
          {
            attribute: 'max_processing_time_ms',
            label: 'Max. Processing Time (ms)',
          },
        ]

        const sql = sqlSet.SignUpProcessingTimeBasic(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)
        const transformedData = defaultAuthReportFormatter(rawData, attributes, groupByProvider)

        return {
          data: transformedData.data,
          attributes: transformedData.chartAttributes,
          query: sql,
        }
      },
    },
    {
      id: 'sign-up-processing-time-percentiles',
      label: 'Sign Up Processing Time Percentiles',
      valuePrecision: 2,
      hide: false,
      hideHighlightedValue: true,
      showTooltip: true,
      showLegend: true,
      showMaxValue: false,
      hideChartType: false,
      defaultChartStyle: 'line',
      titleTooltip:
        'Percentile processing time metrics for sign up operations within the auth server (excludes network latency).',
      entitlement: 'auth',
      requiredPlan: 'Pro',
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'p50_processing_time_ms',
            label: 'P50 Processing Time (ms)',
          },
          {
            attribute: 'p95_processing_time_ms',
            label: 'P95 Processing Time (ms)',
          },
          {
            attribute: 'p99_processing_time_ms',
            label: 'P99 Processing Time (ms)',
          },
        ]

        const sql = sqlSet.SignUpProcessingTimePercentiles(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, useOtel)
        const transformedData = defaultAuthReportFormatter(rawData, attributes, groupByProvider)

        return {
          data: transformedData.data,
          attributes: transformedData.chartAttributes,
          query: sql,
        }
      },
    },
  ]
}

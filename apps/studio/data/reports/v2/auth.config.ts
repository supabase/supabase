import type { AnalyticsInterval } from 'data/analytics/constants'

import { analyticsIntervalToGranularity } from 'data/reports/report.utils'
import { ReportConfig, ReportDataProviderAttribute } from './reports.types'
import { NumericFilter } from 'components/interfaces/Reports/v2/ReportsNumericFilter'
import { fetchLogs } from 'data/reports/report.utils'
import z from 'zod'

const METRIC_KEYS = [
  'ActiveUsers',
  'SignInAttempts',
  'PasswordResetRequests',
  'TotalSignUps',
  'SignInLatency',
  'SignUpLatency',
  'ErrorsByStatus',
]

type MetricKey = (typeof METRIC_KEYS)[number]

const AUTH_REPORT_SQL: Record<
  MetricKey,
  (interval: AnalyticsInterval, filters?: AuthReportFilters) => string
> = {
  ActiveUsers: (interval) => {
    const granularity = analyticsIntervalToGranularity(interval)
    return `
        --active-users
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          count(distinct json_value(f.event_message, "$.auth_event.actor_id")) as count
        from auth_logs f
        where json_value(f.event_message, "$.auth_event.action") in (
          'login', 'user_signedup', 'token_refreshed', 'user_modified',
          'user_recovery_requested', 'user_reauthenticate_requested'
        )
        group by timestamp
        order by timestamp desc
      `
  },
  SignInAttempts: (interval) => {
    const granularity = analyticsIntervalToGranularity(interval)
    return `
        --sign-in-attempts
        SELECT
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
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
        GROUP BY
          timestamp, login_type_provider
        ORDER BY
          timestamp desc, login_type_provider
      `
  },
  PasswordResetRequests: (interval) => {
    const granularity = analyticsIntervalToGranularity(interval)
    return `
        --password-reset-requests
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          count(*) as count
        from auth_logs f
        where json_value(f.event_message, "$.auth_event.action") = 'user_recovery_requested'
        group by timestamp
        order by timestamp desc
      `
  },
  TotalSignUps: (interval) => {
    const granularity = analyticsIntervalToGranularity(interval)
    return `
        --total-signups
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          count(*) as count
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'user_signedup'
        group by timestamp
        order by timestamp desc
      `
  },
  SignInLatency: (interval) => {
    const granularity = analyticsIntervalToGranularity(interval)
    return `
        --signin-latency
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          count(*) as count,
          round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms,
          round(min(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as min_latency_ms,
          round(max(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as max_latency_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(50)] / 1000000, 2) as p50_latency_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(95)] / 1000000, 2) as p95_latency_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(99)] / 1000000, 2) as p99_latency_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'login'
        group by timestamp
        order by timestamp desc
      `
  },
  SignUpLatency: (interval) => {
    const granularity = analyticsIntervalToGranularity(interval)
    return `
        --signup-latency
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          count(*) as count,
          round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms,
          round(min(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as min_latency_ms,
          round(max(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as max_latency_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(50)] / 1000000, 2) as p50_latency_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(95)] / 1000000, 2) as p95_latency_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(99)] / 1000000, 2) as p99_latency_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'user_signedup'
        group by timestamp
        order by timestamp desc
      `
  },
  ErrorsByStatus: (interval) => {
    const granularity = analyticsIntervalToGranularity(interval)
    return `
        --auth-errors-by-status
  select 
    timestamp_trunc(timestamp, ${granularity}) as timestamp,
    count(*) as count,
    response.status_code
  from edge_logs
    cross join unnest(metadata) as m
    cross join unnest(m.request) as request
    cross join unnest(m.response) as response
  where path like '%auth/v1%'
    and response.status_code >= 400 and response.status_code <= 599
  group by timestamp, status_code
  order by timestamp desc
      `
  },
}

type AuthReportFilters = {
  status_code: NumericFilter | null
}

function filterToWhereClause(filters?: AuthReportFilters): string {
  if (!filters) return ''
  return ``
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
  attributes: ReportDataProviderAttribute[]
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

export const createAuthReportConfig = ({
  projectRef,
  startDate,
  endDate,
  interval,
  filters,
}: {
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  filters: AuthReportFilters
}): ReportConfig<AuthReportFilters>[] => [
  {
    id: 'active-user',
    label: 'Active Users',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'The total number of active users over time.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const attributes = [
        { attribute: 'ActiveUsers', provider: 'logs', label: 'Active Users', enabled: true },
      ]

      const sql = AUTH_REPORT_SQL.ActiveUsers(interval, filters)

      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)

      const transformedData = defaultAuthReportFormatter(rawData, attributes)

      return { data: transformedData.data, attributes: transformedData.chartAttributes, query: sql }
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
    availableIn: ['free', 'pro', 'team', 'enterprise'],
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

      const sql = AUTH_REPORT_SQL.SignInAttempts(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
      const transformedData = defaultAuthReportFormatter(rawData, attributes)

      return { data: transformedData.data, attributes: transformedData.chartAttributes, query: sql }
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
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const attributes = [
        {
          attribute: 'TotalSignUps',
          provider: 'logs',
          label: 'Sign Ups',
          enabled: true,
        },
      ]

      const sql = AUTH_REPORT_SQL.TotalSignUps(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
      const transformedData = defaultAuthReportFormatter(rawData, attributes)

      return { data: transformedData.data, attributes: transformedData.chartAttributes, query: sql }
    },
  },
  {
    id: 'auth-errors',
    label: 'API Gateway Auth Errors',
    valuePrecision: 0,
    hide: false,
    showTooltip: true,
    showLegend: false,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'The total number of auth errors by status code from the API Gateway.',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const attributes = [
        {
          attribute: 'ErrorsByStatus',
          provider: 'logs',
          label: 'Auth Errors',
        },
      ]

      const sql = AUTH_REPORT_SQL.ErrorsByStatus(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
      const transformedData = defaultAuthReportFormatter(rawData, attributes)

      return { data: transformedData.data, attributes: transformedData.chartAttributes, query: sql }
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
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const attributes = [
        {
          attribute: 'PasswordResetRequests',
          provider: 'logs',
          label: 'Password Reset Requests',
          enabled: true,
        },
      ]

      const sql = AUTH_REPORT_SQL.PasswordResetRequests(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
      const transformedData = defaultAuthReportFormatter(rawData, attributes)

      return { data: transformedData.data, attributes: transformedData.chartAttributes, query: sql }
    },
  },
  {
    id: 'sign-in-latency',
    label: 'Sign In Latency',
    valuePrecision: 2,
    hide: false,
    hideHighlightedValue: true,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'The average latency for sign in operations by grant type.',
    availableIn: ['pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const attributes = [
        {
          attribute: 'avg_latency_ms',
          label: 'Avg. Latency (ms)',
        },
        {
          attribute: 'max_latency_ms',
          label: 'Max. Latency (ms)',
        },
        {
          attribute: 'min_latency_ms',
          label: 'Min. Latency (ms)',
        },
        {
          attribute: 'p50_latency_ms',
          label: 'P50 Latency (ms)',
        },
        {
          attribute: 'p95_latency_ms',
          label: 'P95 Latency (ms)',
        },
        {
          attribute: 'p99_latency_ms',
          label: 'P99 Latency (ms)',
        },
        {
          attribute: 'request_count',
          label: 'Request Count',
        },
      ]

      const sql = AUTH_REPORT_SQL.SignInLatency(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
      const transformedData = defaultAuthReportFormatter(rawData, attributes)

      return { data: transformedData.data, attributes: transformedData.chartAttributes, query: sql }
    },
  },
  {
    id: 'sign-up-latency',
    label: 'Sign Up Latency',
    valuePrecision: 2,
    hide: false,
    hideHighlightedValue: true,
    showTooltip: true,
    showLegend: true,
    showMaxValue: false,
    hideChartType: false,
    defaultChartStyle: 'line',
    titleTooltip: 'The average latency for sign up operations by provider.',
    availableIn: ['pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const attributes = [
        {
          attribute: 'avg_latency_ms',
          label: 'Avg. Latency (ms)',
        },
        {
          attribute: 'max_latency_ms',
          label: 'Max. Latency (ms)',
        },
        {
          attribute: 'min_latency_ms',
          label: 'Min. Latency (ms)',
        },
        {
          attribute: 'p50_latency_ms',
          label: 'P50 Latency (ms)',
        },
        {
          attribute: 'p95_latency_ms',
          label: 'P95 Latency (ms)',
        },
        {
          attribute: 'p99_latency_ms',
          label: 'P99 Latency (ms)',
        },
        {
          attribute: 'request_count',
          label: 'Request Count',
        },
      ]

      const sql = AUTH_REPORT_SQL.SignUpLatency(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
      const transformedData = defaultAuthReportFormatter(rawData, attributes)

      return { data: transformedData.data, attributes: transformedData.chartAttributes, query: sql }
    },
  },
]

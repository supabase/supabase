import { useQuery } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { AnalyticsInterval } from 'data/analytics/constants'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import { getHttpStatusCodeInfo } from 'lib/http-status-codes'
import { analyticsIntervalToGranularity } from './report.utils'

/**
 * METRICS
 * Each chart in the UI has a corresponding metric key.
 */

const METRIC_KEYS = [
  'ActiveUsers',
  'SignInAttempts',
  'PasswordResetRequests',
  'TotalSignUps',
  'SignInLatency',
  'SignUpLatency',
  'ErrorsByStatus',
]

const STATUS_CODE_COLORS: { [key: string]: { light: string; dark: string } } = {
  '400': { light: '#FFD54F', dark: '#FFF176' },
  '401': { light: '#FF8A65', dark: '#FFAB91' },
  '403': { light: '#FFB74D', dark: '#FFCC80' },
  '404': { light: '#90A4AE', dark: '#B0BEC5' },
  '409': { light: '#BA68C8', dark: '#CE93D8' },
  '410': { light: '#A1887F', dark: '#BCAAA4' },
  '422': { light: '#FF9800', dark: '#FFB74D' },
  '429': { light: '#E65100', dark: '#F57C00' },
  '500': { light: '#B71C1C', dark: '#D32F2F' },
  '502': { light: '#9575CD', dark: '#B39DDB' },
  '503': { light: '#0097A7', dark: '#4DD0E1' },
  '504': { light: '#C0CA33', dark: '#D4E157' },
  default: { light: '#757575', dark: '#9E9E9E' },
}

type MetricKey = (typeof METRIC_KEYS)[number]

/**
 * SQL
 * Each metric has a corresponding SQL query.
 */

const METRIC_SQL: Record<MetricKey, (interval: AnalyticsInterval) => string> = {
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
        json_value(event_message, "$.grant_type") as grant_type,
        count(*) as request_count,
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms,
        round(min(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as min_latency_ms,
        round(max(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as max_latency_ms,
        round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(50)] / 1000000, 2) as p50_latency_ms,
        round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(95)] / 1000000, 2) as p95_latency_ms,
        round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(99)] / 1000000, 2) as p99_latency_ms
      from auth_logs
      where json_value(event_message, "$.path") = '/token'
      group by timestamp, grant_type
      order by timestamp desc, grant_type
    `
  },
  SignUpLatency: (interval) => {
    const granularity = analyticsIntervalToGranularity(interval)
    return `
      --signup-latency
      select 
        timestamp_trunc(timestamp, ${granularity}) as timestamp,
        json_value(event_message, "$.auth_event.traits.provider") as provider,
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms,
        round(min(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as min_latency_ms,
        round(max(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as max_latency_ms,
        round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(50)] / 1000000, 2) as p50_latency_ms,
        round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(95)] / 1000000, 2) as p95_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'user_signedup'
        and json_value(event_message, "$.status") = '200'
      group by timestamp, provider
      order by timestamp desc, provider
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
where path like '%/auth%'
  and response.status_code >= 400 and response.status_code <= 599
group by timestamp, status_code
order by timestamp desc
    `
  },
}

/**
 * FORMATTERS.
 * Metrics need to be formatted before being passed on to the UI charts.
 */

function defaultFormatter(rawData: any, attributes: MultiAttribute[]) {
  const chartAttributes = attributes
  if (!rawData) return { data: undefined, chartAttributes }
  const result = rawData.result || []
  const timestamps = new Set<string>(result.map((p: any) => p.timestamp))
  const data = Array.from(timestamps)
    .sort()
    .map((timestamp) => {
      const point: any = { period_start: timestamp }
      chartAttributes.forEach((attr) => {
        point[attr.attribute] = 0
      })
      const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
      matchingPoints.forEach((p: any) => {
        point[attributes[0].attribute] = p.count
      })
      return point
    })
  return { data, chartAttributes }
}

const METRIC_FORMATTER: Record<
  MetricKey,
  (
    rawData: any,
    attributes: MultiAttribute[],
    logsMetric: string
  ) => { data: any; chartAttributes: any }
> = {
  ActiveUsers: (rawData, attributes) => defaultFormatter(rawData, attributes),
  SignInAttempts: (rawData, attributes) => {
    const chartAttributes = attributes.map((attr) => {
      if (attr.attribute === 'SignInAttempts' && attr.login_type_provider) {
        return { ...attr, attribute: `${attr.attribute}_${attr.login_type_provider}` }
      }
      return attr
    })
    if (!rawData) return { data: undefined, chartAttributes }
    const result = rawData.result || []
    const timestamps = new Set<string>(result.map((p: any) => p.timestamp))
    const data = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { period_start: timestamp }
        chartAttributes.forEach((attr) => {
          point[attr.attribute] = 0
        })
        const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
        matchingPoints.forEach((p: any) => {
          point[`SignInAttempts_${p.login_type_provider}`] = p.count
        })
        return point
      })
    return { data, chartAttributes }
  },
  PasswordResetRequests: (rawData, attributes) => defaultFormatter(rawData, attributes),
  TotalSignUps: (rawData, attributes) => defaultFormatter(rawData, attributes),
  SignInLatency: (rawData, attributes) => defaultFormatter(rawData, attributes),
  SignUpLatency: (rawData, attributes) => defaultFormatter(rawData, attributes),
  ErrorsByStatus: (rawData, attributes) => {
    if (!rawData) return { data: undefined, chartAttributes: attributes }
    const result = rawData.result || []

    const statusCodes = Array.from(new Set(result.map((p: any) => p.status_code)))

    const chartAttributes = statusCodes.map((statusCode) => {
      const statusCodeInfo = getHttpStatusCodeInfo(Number(statusCode))
      const color = STATUS_CODE_COLORS[String(statusCode)] || STATUS_CODE_COLORS.default

      return {
        attribute: `status_${statusCode}`,
        label: `${statusCode} ${statusCodeInfo.label}`,
        provider: 'logs',
        enabled: true,
        color: color,
        statusCode: String(statusCode),
      }
    })

    const timestamps = new Set<string>(result.map((p: any) => p.timestamp))
    const data = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { period_start: timestamp }
        chartAttributes.forEach((attr) => {
          point[attr.attribute] = 0
        })
        const matchingPoints = result.filter((p: any) => p.timestamp === timestamp)
        matchingPoints.forEach((p: any) => {
          point[`status_${p.status_code}`] = p.count
        })
        return point
      })

    return { data, chartAttributes }
  },
}

/**
 * REPORT QUERY.
 * Fetching and state management for the report.
 */

export function useAuthLogsReport({
  projectRef,
  attributes,
  startDate,
  endDate,
  interval,
  enabled = true,
}: {
  projectRef: string
  attributes: MultiAttribute[]
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  enabled?: boolean
}) {
  const logsMetric = attributes.length > 0 ? attributes[0].attribute : ''

  const isAuthMetric = METRIC_KEYS.includes(logsMetric)

  const sql = isAuthMetric ? METRIC_SQL[logsMetric](interval) : ''

  const {
    data: rawData,
    error,
    isLoading,
    isFetching,
  } = useQuery(
    ['auth-logs-report', projectRef, logsMetric, startDate, endDate, interval, sql],
    async () => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            sql,
            iso_timestamp_start: startDate,
            iso_timestamp_end: endDate,
          },
        },
      })
      if (error) throw error
      return data
    },
    {
      enabled: Boolean(projectRef && sql && enabled && isAuthMetric),
      refetchOnWindowFocus: false,
    }
  )

  // Use formatter if available
  const formatter =
    (isAuthMetric ? METRIC_FORMATTER[logsMetric as MetricKey] : undefined) || defaultFormatter
  const { data, chartAttributes } = formatter(rawData, attributes, logsMetric)

  return {
    data,
    attributes: chartAttributes,
    isLoading,
    error,
    isFetching,
  }
}

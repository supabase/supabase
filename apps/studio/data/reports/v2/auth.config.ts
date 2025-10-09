import type { AnalyticsInterval } from 'data/analytics/constants'

import { analyticsIntervalToGranularity } from 'data/reports/report.utils'
import { ReportConfig, ReportDataProviderAttribute } from './reports.types'
import { NumericFilter } from 'components/interfaces/Reports/v2/ReportsNumericFilter'
import { fetchLogs } from 'data/reports/report.utils'
import z from 'zod'
import {
  extractStatusCodesFromData,
  generateStatusCodeAttributes,
  transformCategoricalCountData,
  transformStatusCodeData,
} from 'components/interfaces/Reports/Reports.utils'
import { AUTH_ERROR_CODES } from 'common/constants/auth-error-codes'

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

function buildUsageAllSQL(
  interval: AnalyticsInterval,
  filters: AuthReportFilters | undefined,
  startDate: string, // ISO 8601, e.g. "2025-10-09T00:00:00Z"
  endDate: string
) {
  const granularity = analyticsIntervalToGranularity(interval)

  const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)

  // Build provider clause for filtering in base CTE
  const providerClause =
    filters?.provider && filters.provider.length > 0
      ? `AND COALESCE(JSON_VALUE(event_message, '$.provider'), 'unknown') IN (${filters.provider
          .map((p) => `'${p.replace(/'/g, "\\'")}'`)
          .join(', ')})`
      : ''

  return `
    -- usage-all (single fetch, single scan of auth_logs) — NO bucket generation, FE fills gaps
    WITH
    params AS (
      SELECT
        COALESCE(
          PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*S%Ez', '${startDate}'),
          TIMESTAMP('${startDate}')
        ) AS start_ts,
        COALESCE(
          PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*S%Ez', '${endDate}'),
          TIMESTAMP('${endDate}')
        ) AS end_ts
    ),

    -- single pass over auth_logs, parse JSON once
    base AS (
      SELECT
        TIMESTAMP_TRUNC(timestamp, ${granularity}) AS ts,
        COALESCE(JSON_VALUE(event_message, '$.auth_event.action'), JSON_VALUE(event_message, '$.action')) AS action,
        COALESCE(JSON_VALUE(event_message, '$.auth_event.actor_id'), JSON_VALUE(event_message, '$.user_id')) AS actor_id,
        COALESCE(JSON_VALUE(event_message, '$.provider'), 'unknown') AS provider,
        JSON_VALUE(event_message, '$.login_method') AS login_method,
        CASE
          WHEN JSON_VALUE(event_message, '$.metering') IS NOT NULL THEN LOWER(JSON_VALUE(event_message, '$.metering'))
          WHEN JSON_QUERY(event_message, '$.metering') = 'true' THEN 'true'
          ELSE ''
        END AS metering
      FROM auth_logs, params
      WHERE timestamp >= start_ts AND timestamp < end_ts
      ${providerClause}
    ),

    -- aggregate usage metrics from the same base rows
    agg_usage AS (
      SELECT
        ts
        ${groupByProvider ? ', provider' : ''},
        COUNT(DISTINCT IF(action IN ('login','user_signedup','token_refreshed','user_modified','user_recovery_requested','user_reauthenticate_requested'), actor_id, NULL)) AS active_users,
        COUNTIF(action = 'user_signedup') AS total_signups,
        COUNTIF(action = 'user_recovery_requested') AS password_reset_requests
      FROM base
      GROUP BY ts${groupByProvider ? ', provider' : ''}
    ),

    -- sign-in attempts by login_type_provider from the same base rows
    agg_signin AS (
      SELECT
        ts
        ${groupByProvider ? ', provider' : ''},
        CASE
          WHEN COALESCE(provider, '') != '' THEN CONCAT(login_method, ' (', provider, ')')
          ELSE login_method
        END AS login_type_provider,
        COUNTIF(action = 'login' AND metering = 'true') AS count
      FROM base
      GROUP BY ts, login_type_provider${groupByProvider ? ', provider' : ''}
    )

    -- emit tall result; no LEFT JOIN to a bucket table
    SELECT ts AS timestamp, 'ActiveUsers' AS metric, active_users AS count,
           ${groupByProvider ? 'provider' : 'CAST(NULL AS STRING) AS provider'},
           CAST(NULL AS STRING) AS login_type_provider
    FROM agg_usage

    UNION ALL
    SELECT ts, 'TotalSignUps', total_signups,
           ${groupByProvider ? 'provider' : 'CAST(NULL AS STRING) AS provider'},
           CAST(NULL AS STRING)
    FROM agg_usage

    UNION ALL
    SELECT ts, 'PasswordResetRequests', password_reset_requests,
           ${groupByProvider ? 'provider' : 'CAST(NULL AS STRING) AS provider'},
           CAST(NULL AS STRING)
    FROM agg_usage

    UNION ALL
    SELECT ts, 'SignInAttempts', count,
           ${groupByProvider ? 'provider' : 'CAST(NULL AS STRING) AS provider'},
           login_type_provider
    FROM agg_signin

    ORDER BY timestamp DESC${groupByProvider ? ', provider' : ''}
  `
}

function buildAuthLatencyAllSQL(
  interval: AnalyticsInterval,
  filters: AuthReportFilters | undefined,
  startDate: string,
  endDate: string
) {
  const granularity = analyticsIntervalToGranularity(interval)

  return `
    -- Auth latency (sign-in + sign-up), single scan, FE does zero-fill
    WITH params AS (
      SELECT
        COALESCE(PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*S%Ez', '${startDate}'), TIMESTAMP('${startDate}')) AS start_ts,
        COALESCE(PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*S%Ez', '${endDate}'),   TIMESTAMP('${endDate}'))   AS end_ts
    ),
    base AS (
      SELECT
        TIMESTAMP_TRUNC(timestamp, ${granularity}) AS ts,
        -- normalize action; accept both signup spellings
        CASE COALESCE(JSON_VALUE(event_message, '$.auth_event.action'), JSON_VALUE(event_message, '$.action'))
          WHEN 'login' THEN 'SignInLatency'
          WHEN 'user_signedup' THEN 'SignUpLatency'
          WHEN 'user_signed_up' THEN 'SignUpLatency'
          ELSE NULL
        END AS metric,
        -- normalize to milliseconds; prefer explicit *ms fields, then convert us/ns
        COALESCE(
          -- already in ms
          SAFE_CAST(JSON_VALUE(event_message, '$.processing_time_ms') AS FLOAT64),
          SAFE_CAST(JSON_VALUE(event_message, '$.auth_event.processing_time_ms') AS FLOAT64),
          SAFE_CAST(JSON_VALUE(event_message, '$.duration_ms') AS FLOAT64),
          SAFE_CAST(JSON_VALUE(event_message, '$.auth_event.duration_ms') AS FLOAT64),
          -- microseconds -> ms
          SAFE_CAST(JSON_VALUE(event_message, '$.processing_time_us') AS FLOAT64) / 1000.0,
          SAFE_CAST(JSON_VALUE(event_message, '$.auth_event.processing_time_us') AS FLOAT64) / 1000.0,
          SAFE_CAST(JSON_VALUE(event_message, '$.duration_us') AS FLOAT64) / 1000.0,
          SAFE_CAST(JSON_VALUE(event_message, '$.auth_event.duration_us') AS FLOAT64) / 1000.0,
          -- nanoseconds -> ms
          SAFE_CAST(JSON_VALUE(event_message, '$.processing_time_ns') AS FLOAT64) / 1000000.0,
          SAFE_CAST(JSON_VALUE(event_message, '$.auth_event.processing_time_ns') AS FLOAT64) / 1000000.0,
          SAFE_CAST(JSON_VALUE(event_message, '$.duration_ns') AS FLOAT64) / 1000000.0,
          SAFE_CAST(JSON_VALUE(event_message, '$.auth_event.duration_ns') AS FLOAT64) / 1000000.0,
          -- unlabeled duration: assume ns -> ms to match observed magnitudes
          SAFE_CAST(JSON_VALUE(event_message, '$.duration') AS FLOAT64) / 1000000.0,
          SAFE_CAST(JSON_VALUE(event_message, '$.auth_event.duration') AS FLOAT64) / 1000000.0
        ) AS latency_ms
      FROM auth_logs, params
      WHERE timestamp >= start_ts AND timestamp < end_ts
    ),
    filtered AS (
      SELECT
        ts,
        metric,
        latency_ms
      FROM base
      WHERE metric IS NOT NULL
    ),
    basic AS (
      SELECT
        ts,
        metric,
        MIN(latency_ms) AS min,
        AVG(latency_ms) AS avg,
        MAX(latency_ms) AS max
      FROM filtered
      GROUP BY ts, metric
    ),
    pct AS (
      SELECT
        ts,
        metric,
        APPROX_QUANTILES(latency_ms, 100) AS q
      FROM filtered
      GROUP BY ts, metric
    )
    SELECT
      b.ts AS timestamp,
      b.metric,
      b.min  AS min_processing_time_ms,
      b.avg  AS avg_processing_time_ms,
      b.max  AS max_processing_time_ms,
      q[OFFSET(50)] AS p50_processing_time_ms,
      q[OFFSET(95)] AS p95_processing_time_ms,
      q[OFFSET(99)] AS p99_processing_time_ms
    FROM basic b
    JOIN pct USING (ts, metric)
    ORDER BY timestamp DESC, metric
  `
}

const AUTH_REPORT_SQL: Record<
  MetricKey,
  (interval: AnalyticsInterval, filters?: AuthReportFilters) => string
> = {
  ErrorsByStatus: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = edgeLogsFilterToWhereClause(filters)
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
    cross join unnest(response.headers) as h
  where path like '%auth/v1%'
    and response.status_code >= 400 and response.status_code <= 599
    ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
  group by timestamp, status_code
  order by timestamp desc
      `
  },
  ErrorsByAuthCode: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = edgeLogsFilterToWhereClause(filters)
    return `
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
    ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
  group by timestamp, error_code
  order by timestamp desc
      `
  },
}

type AuthReportFilters = {
  status_code?: NumericFilter | null
  provider?: string[] | null
}

function filterToWhereClause(filters?: AuthReportFilters): string {
  const whereClauses: string[] = []

  if (filters?.status_code) {
    whereClauses.push(
      `response.status_code ${filters.status_code.operator} ${filters.status_code.value}`
    )
  }

  if (filters?.provider && filters.provider.length > 0) {
    const providerList = filters.provider.map((p) => `'${p}'`).join(', ')
    whereClauses.push(`JSON_VALUE(event_message, "$.provider") IN (${providerList})`)
  }

  return whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
}

function edgeLogsFilterToWhereClause(filters?: AuthReportFilters): string {
  const whereClauses: string[] = []

  if (filters?.status_code) {
    whereClauses.push(
      `response.status_code ${filters.status_code.operator} ${filters.status_code.value}`
    )
  }

  return whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
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

            // Optional metric filter for panels that multiplex (e.g., latency SignIn vs SignUp)
            const metricFilter = (attr as any).metricFilter as string | undefined
            if (metricFilter && p.metric !== metricFilter) return

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
            // Optional metric filter for panels that multiplex (e.g., latency SignIn vs SignUp)
            const metricFilter = (attr as any).metricFilter as string | undefined
            if (metricFilter && p.metric !== metricFilter) return
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

export const AUTH_REPORT_QUERY_KEYS = {
  usage: ['usage-all'],
  monitoring: ['monitoring-all'],
  performance: ['performance-all'],
}

export const createUsageReportConfig = ({
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
}): ReportConfig<AuthReportFilters>[] => {
  const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)

  const usageSql = buildUsageAllSQL(interval, filters, startDate, endDate)
  const usageDataPromise = fetchLogs(projectRef, usageSql, startDate, endDate)

  return [
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
      queryKeys: AUTH_REPORT_QUERY_KEYS.usage,
      dataProvider: async () => {
        const attributes = [
          { attribute: 'ActiveUsers', provider: 'logs', label: 'Active Users', enabled: true },
        ]
        const sql = usageSql
        const rawData = await usageDataPromise
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
      availableIn: ['free', 'pro', 'team', 'enterprise'],
      queryKeys: AUTH_REPORT_QUERY_KEYS.usage,
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
        const sql = usageSql
        const rawData = await usageDataPromise
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
      availableIn: ['free', 'pro', 'team', 'enterprise'],
      queryKeys: AUTH_REPORT_QUERY_KEYS.usage,
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'TotalSignUps',
            provider: 'logs',
            label: 'Sign Ups',
            enabled: true,
          },
        ]
        const sql = usageSql
        const rawData = await usageDataPromise
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
      availableIn: ['free', 'pro', 'team', 'enterprise'],
      queryKeys: AUTH_REPORT_QUERY_KEYS.usage,
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'PasswordResetRequests',
            provider: 'logs',
            label: 'Password Reset Requests',
            enabled: true,
          },
        ]
        const sql = usageSql
        const rawData = await usageDataPromise
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
}: {
  projectRef: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  filters: AuthReportFilters
}): ReportConfig<AuthReportFilters>[] => [
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
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const sql = AUTH_REPORT_SQL.ErrorsByStatus(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)

      if (!rawData?.result) return { data: [] }

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
    availableIn: ['free', 'pro', 'team', 'enterprise'],
    dataProvider: async () => {
      const sql = AUTH_REPORT_SQL.ErrorsByAuthCode(interval, filters)
      const rawData = await fetchLogs(projectRef, sql, startDate, endDate)

      if (!rawData?.result) return { data: [] }

      const categories = rawData.result
        .map((r: any) => r.error_code)
        .filter((v: any) => v !== null && v !== undefined)
      const distinct = Array.from(new Set(categories)).sort()

      const attributes = distinct.map((c: string) => ({
        attribute: c,
        label: c,
        tooltip: AUTH_ERROR_CODE_LIST.find((e) => e.key === c)?.description,
      }))

      const data = rawData.result.map((point: any) => ({
        ...point,
        timestamp: point.timestamp,
      }))

      const pivoted = transformCategoricalCountData(rawData.result, 'error_code', distinct)

      return { data: pivoted, attributes, query: sql }
    },
  },
]

export const createLatencyReportConfig = ({
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
}): ReportConfig<AuthReportFilters>[] => {
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
      availableIn: ['free', 'pro', 'team', 'enterprise'],
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'avg_processing_time_ms',
            label: 'Avg. Processing Time (ms)',
            metricFilter: 'SignInLatency',
          },
          {
            attribute: 'min_processing_time_ms',
            label: 'Min. Processing Time (ms)',
            metricFilter: 'SignInLatency',
          },
          {
            attribute: 'max_processing_time_ms',
            label: 'Max. Processing Time (ms)',
            metricFilter: 'SignInLatency',
          },
        ]

        const sql = buildAuthLatencyAllSQL(interval, filters, startDate, endDate)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
        const transformedData = defaultAuthReportFormatter(rawData, attributes)

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
      availableIn: ['pro', 'team', 'enterprise'],
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'p50_processing_time_ms',
            label: 'P50 Processing Time (ms)',
            metricFilter: 'SignInLatency',
          },
          {
            attribute: 'p95_processing_time_ms',
            label: 'P95 Processing Time (ms)',
            metricFilter: 'SignInLatency',
          },
          {
            attribute: 'p99_processing_time_ms',
            label: 'P99 Processing Time (ms)',
            metricFilter: 'SignInLatency',
          },
        ]

        const sql = buildAuthLatencyAllSQL(interval, filters, startDate, endDate)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
        const transformedData = defaultAuthReportFormatter(rawData, attributes)

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
      availableIn: ['free', 'pro', 'team', 'enterprise'],
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'avg_processing_time_ms',
            label: 'Avg. Processing Time (ms)',
            metricFilter: 'SignUpLatency',
          },
          {
            attribute: 'min_processing_time_ms',
            label: 'Min. Processing Time (ms)',
            metricFilter: 'SignUpLatency',
          },
          {
            attribute: 'max_processing_time_ms',
            label: 'Max. Processing Time (ms)',
            metricFilter: 'SignUpLatency',
          },
        ]

        const sql = buildAuthLatencyAllSQL(interval, filters, startDate, endDate)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
        const transformedData = defaultAuthReportFormatter(rawData, attributes)

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
      availableIn: ['pro', 'team', 'enterprise'],
      dataProvider: async () => {
        const attributes = [
          {
            attribute: 'p50_processing_time_ms',
            label: 'P50 Processing Time (ms)',
            metricFilter: 'SignUpLatency',
          },
          {
            attribute: 'p95_processing_time_ms',
            label: 'P95 Processing Time (ms)',
            metricFilter: 'SignUpLatency',
          },
          {
            attribute: 'p99_processing_time_ms',
            label: 'P99 Processing Time (ms)',
            metricFilter: 'SignUpLatency',
          },
        ]

        const sql = buildAuthLatencyAllSQL(interval, filters, startDate, endDate)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
        const transformedData = defaultAuthReportFormatter(rawData, attributes)

        return {
          data: transformedData.data,
          attributes: transformedData.chartAttributes,
          query: sql,
        }
      },
    },
  ]
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
  ...createUsageReportConfig({ projectRef, startDate, endDate, interval, filters }),
  ...createErrorsReportConfig({ projectRef, startDate, endDate, interval, filters }),
  ...createLatencyReportConfig({ projectRef, startDate, endDate, interval, filters }),
]

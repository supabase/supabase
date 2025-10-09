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
        JSON_VALUE(event_message, '$.auth_event.action') AS action,
        JSON_VALUE(event_message, '$.auth_event.actor_id') AS actor_id,
        COALESCE(JSON_VALUE(event_message, '$.provider'), 'unknown') AS provider,
        JSON_VALUE(event_message, '$.login_method') AS login_method,
        JSON_VALUE(event_message, '$.metering') AS metering
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
        COUNTIF(action = 'login' AND LOWER(COALESCE(metering, '')) = 'true') AS count
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

const AUTH_REPORT_SQL: Record<
  MetricKey,
  (interval: AnalyticsInterval, filters?: AuthReportFilters) => string
> = {
  SignInProcessingTimeBasic: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = filterToWhereClause(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return `
        --signin-processing-time-basic
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${groupByProvider ? 'COALESCE(JSON_VALUE(event_message, "$.provider"), \'unknown\') as provider,' : ''}
          count(*) as count,
          round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_processing_time_ms,
          round(min(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as min_processing_time_ms,
          round(max(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as max_processing_time_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'login'
        ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
        group by timestamp${groupByProvider ? ', provider' : ''}
        order by timestamp desc${groupByProvider ? ', provider' : ''}
      `
  },
  SignInProcessingTimePercentiles: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = filterToWhereClause(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return `
        --signin-processing-time-percentiles
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${groupByProvider ? 'COALESCE(JSON_VALUE(event_message, "$.provider"), \'unknown\') as provider,' : ''}
          count(*) as count,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(50)] / 1000000, 2) as p50_processing_time_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(95)] / 1000000, 2) as p95_processing_time_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(99)] / 1000000, 2) as p99_processing_time_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'login'
        ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
        group by timestamp${groupByProvider ? ', provider' : ''}
        order by timestamp desc${groupByProvider ? ', provider' : ''}
      `
  },
  SignUpProcessingTimeBasic: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = filterToWhereClause(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return `
        --signup-processing-time-basic
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${groupByProvider ? 'COALESCE(JSON_VALUE(event_message, "$.provider"), \'unknown\') as provider,' : ''}
          count(*) as count,
          round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_processing_time_ms,
          round(min(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as min_processing_time_ms,
          round(max(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as max_processing_time_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'user_signedup'
        ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
        group by timestamp${groupByProvider ? ', provider' : ''}
        order by timestamp desc${groupByProvider ? ', provider' : ''}
      `
  },
  SignUpProcessingTimePercentiles: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = filterToWhereClause(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return `
        --signup-processing-time-percentiles
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${groupByProvider ? 'COALESCE(JSON_VALUE(event_message, "$.provider"), \'unknown\') as provider,' : ''}
          count(*) as count,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(50)] / 1000000, 2) as p50_processing_time_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(95)] / 1000000, 2) as p95_processing_time_ms,
          round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(99)] / 1000000, 2) as p99_processing_time_ms
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'user_signedup'
        ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
        group by timestamp${groupByProvider ? ', provider' : ''}
        order by timestamp desc${groupByProvider ? ', provider' : ''}
      `
  },
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

            // If payload includes metric, ensure it matches this attribute's base metric
            if (typeof p.metric === 'string') {
              if (
                p.metric !== baseAttribute &&
                !('login_type_provider' in (attr as any) && p.metric === 'SignInAttempts')
              ) {
                return
              }
            }

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
            // If payload includes metric, ensure row belongs to this attribute
            if (typeof p.metric === 'string') {
              if (
                p.metric !== attr.attribute &&
                !('login_type_provider' in (attr as any) && p.metric === 'SignInAttempts')
              ) {
                return
              }
            }
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
  const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)

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

        const sql = AUTH_REPORT_SQL.SignInProcessingTimeBasic(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
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
      availableIn: ['pro', 'team', 'enterprise'],
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

        const sql = AUTH_REPORT_SQL.SignInProcessingTimePercentiles(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
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
      availableIn: ['free', 'pro', 'team', 'enterprise'],
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

        const sql = AUTH_REPORT_SQL.SignUpProcessingTimeBasic(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
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
      availableIn: ['pro', 'team', 'enterprise'],
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

        const sql = AUTH_REPORT_SQL.SignUpProcessingTimePercentiles(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate)
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

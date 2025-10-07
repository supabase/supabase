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

const AUTH_REPORT_SQL: Record<
  MetricKey,
  (interval: AnalyticsInterval, filters?: AuthReportFilters) => string
> = {
  ActiveUsers: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = filterToWhereClause(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return `
        --active-users
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${groupByProvider ? 'COALESCE(JSON_VALUE(f.event_message, "$.provider"), \'unknown\') as provider,' : ''}
          count(distinct json_value(f.event_message, "$.auth_event.actor_id")) as count
        from auth_logs f
        where json_value(f.event_message, "$.auth_event.action") in (
          'login', 'user_signedup', 'token_refreshed', 'user_modified',
          'user_recovery_requested', 'user_reauthenticate_requested'
        )
        ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
        group by timestamp${groupByProvider ? ', provider' : ''}
        order by timestamp desc${groupByProvider ? ', provider' : ''}
      `
  },
  SignInAttempts: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = filterToWhereClause(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return `
        --sign-in-attempts
        SELECT
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${groupByProvider ? 'COALESCE(JSON_VALUE(event_message, "$.provider"), \'unknown\') as provider,' : ''}
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
          ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
        GROUP BY
          timestamp, login_type_provider${groupByProvider ? ', provider' : ''}
        ORDER BY
          timestamp desc, login_type_provider${groupByProvider ? ', provider' : ''}
      `
  },
  PasswordResetRequests: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = filterToWhereClause(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return `
        --password-reset-requests
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${groupByProvider ? 'COALESCE(JSON_VALUE(f.event_message, "$.provider"), \'unknown\') as provider,' : ''}
          count(*) as count
        from auth_logs f
        where json_value(f.event_message, "$.auth_event.action") = 'user_recovery_requested'
        ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
        group by timestamp${groupByProvider ? ', provider' : ''}
        order by timestamp desc${groupByProvider ? ', provider' : ''}
      `
  },
  TotalSignUps: (interval, filters) => {
    const granularity = analyticsIntervalToGranularity(interval)
    const whereClause = filterToWhereClause(filters)
    const groupByProvider = Boolean(filters?.provider && filters.provider.length > 0)
    return `
        --total-signups
        select 
          timestamp_trunc(timestamp, ${granularity}) as timestamp,
          ${groupByProvider ? 'COALESCE(JSON_VALUE(event_message, "$.provider"), \'unknown\') as provider,' : ''}
          count(*) as count
        from auth_logs
        where json_value(event_message, "$.auth_event.action") = 'user_signedup'
        ${whereClause ? `AND ${whereClause.replace(/^WHERE\s+/, '')}` : ''}
        group by timestamp${groupByProvider ? ', provider' : ''}
        order by timestamp desc${groupByProvider ? ', provider' : ''}
      `
  },
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

export const AUTH_ERROR_CODE_VALUES: string[] = [
  'anonymous_provider_disabled',
  'bad_code_verifier',
  'bad_json',
  'bad_jwt',
  'bad_oauth_callback',
  'bad_oauth_state',
  'captcha_failed',
  'conflict',
  'email_address_invalid',
  'email_address_not_authorized',
  'email_conflict_identity_not_deletable',
  'email_exists',
  'email_not_confirmed',
  'email_provider_disabled',
  'flow_state_expired',
  'flow_state_not_found',
  'hook_payload_invalid_content_type',
  'hook_payload_over_size_limit',
  'hook_timeout',
  'hook_timeout_after_retry',
  'identity_already_exists',
  'identity_not_found',
  'insufficient_aal',
  'invalid_credentials',
  'invite_not_found',
  'manual_linking_disabled',
  'mfa_challenge_expired',
  'mfa_factor_name_conflict',
  'mfa_factor_not_found',
  'mfa_ip_address_mismatch',
  'mfa_phone_enroll_not_enabled',
  'mfa_phone_verify_not_enabled',
  'mfa_totp_enroll_not_enabled',
  'mfa_totp_verify_not_enabled',
  'mfa_verification_failed',
  'mfa_verification_rejected',
  'mfa_verified_factor_exists',
  'mfa_web_authn_enroll_not_enabled',
  'mfa_web_authn_verify_not_enabled',
  'no_authorization',
  'not_admin',
  'oauth_provider_not_supported',
  'otp_disabled',
  'otp_expired',
  'over_email_send_rate_limit',
  'over_request_rate_limit',
  'over_sms_send_rate_limit',
  'phone_exists',
  'phone_not_confirmed',
  'phone_provider_disabled',
  'provider_disabled',
  'provider_email_needs_verification',
  'reauthentication_needed',
  'reauthentication_not_valid',
  'refresh_token_already_used',
  'refresh_token_not_found',
  'request_timeout',
  'same_password',
  'saml_assertion_no_email',
  'saml_assertion_no_user_id',
  'saml_entity_id_mismatch',
  'saml_idp_already_exists',
  'saml_idp_not_found',
  'saml_metadata_fetch_failed',
  'saml_provider_disabled',
  'saml_relay_state_expired',
  'saml_relay_state_not_found',
  'session_expired',
  'session_not_found',
  'signup_disabled',
  'single_identity_not_deletable',
  'sms_send_failed',
  'sso_domain_already_exists',
  'sso_provider_not_found',
  'too_many_enrolled_mfa_factors',
  'unexpected_audience',
  'unexpected_failure',
  'user_already_exists',
  'user_banned',
  'user_not_found',
  'user_sso_managed',
  'validation_failed',
  'weak_password',
]

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

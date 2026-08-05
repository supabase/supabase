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
] as const

type MetricKey = (typeof METRIC_KEYS)[number]

type AuthReportFilters = {
  status_code?: NumericFilter | null
  provider?: string[] | null
}

const PROVIDER_GROUP_BY_FRAGMENT = safeSql`, provider`
const EMPTY = safeSql``

function providerGroupBy(groupByProvider: boolean): SafeLogSqlFragment {
  return groupByProvider ? PROVIDER_GROUP_BY_FRAGMENT : EMPTY
}

// fillTimeseries/isUnixMicro expects a 16-digit unix-microsecond timestamp, matching BigQuery's timestamp_trunc.
const TIMESTAMP_BUCKET: Record<Granularity, SafeLogSqlFragment> = {
  minute: safeSql`toUnixTimestamp(toStartOfMinute(timestamp)) * 1000000`,
  hour: safeSql`toUnixTimestamp(toStartOfHour(timestamp)) * 1000000`,
  day: safeSql`toUnixTimestamp(toStartOfDay(timestamp)) * 1000000`,
}

const PROVIDER_SELECT_FRAGMENT = safeSql`coalesce(nullIf(JSONExtractString(event_message, 'provider'), ''), 'unknown') as provider,`

function providerSelectFragment(groupByProvider: boolean): SafeLogSqlFragment {
  return groupByProvider ? PROVIDER_SELECT_FRAGMENT : EMPTY
}

// auth_logs rows have no HTTP response fields, so status_code can't apply here.
function authFilterSql(filters?: AuthReportFilters): SafeLogSqlFragment {
  if (filters?.provider && filters.provider.length > 0) {
    const list = joinSqlFragments(filters.provider.map(analyticsLiteral), ', ')
    return safeSql`AND JSONExtractString(event_message, 'provider') IN (${list})`
  }
  return EMPTY
}

// edge_logs rows have no auth provider field, so provider can't apply here.
function edgeLogsFilterSql(filters?: AuthReportFilters): SafeLogSqlFragment {
  if (filters?.status_code) {
    const op = SAFE_COMPARISON_OPERATOR_SQL[filters.status_code.operator]
    return safeSql`AND toInt32OrZero(log_attributes['response.status_code']) ${op} ${analyticsLiteral(filters.status_code.value)}`
  }
  return EMPTY
}

function authQuerySetup(interval: AnalyticsInterval, filters?: AuthReportFilters) {
  return {
    ts: TIMESTAMP_BUCKET[analyticsIntervalToGranularity(interval)],
    filterSql: authFilterSql(filters),
    groupByProvider: Boolean(filters?.provider && filters.provider.length > 0),
  }
}

export const AUTH_REPORT_SQL: Record<
  MetricKey,
  (interval: AnalyticsInterval, filters?: AuthReportFilters) => SafeLogSqlFragment
> = {
  ActiveUsers: (interval, filters) => {
    const { ts, filterSql, groupByProvider } = authQuerySetup(interval, filters)
    return safeSql`
        --active-users (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragment(groupByProvider)}
          count(distinct JSONExtractString(event_message, 'auth_event', 'actor_id')) as count
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') in (
            'login', 'user_signedup', 'token_refreshed', 'user_modified',
            'user_recovery_requested', 'user_reauthenticate_requested'
          )
        ${filterSql}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignInAttempts: (interval, filters) => {
    const { ts, filterSql, groupByProvider } = authQuerySetup(interval, filters)
    return safeSql`
        --sign-in-attempts (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragment(groupByProvider)}
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
        ${filterSql}
        group by ${ts}, login_type_provider${providerGroupBy(groupByProvider)}
        order by ${ts} desc, login_type_provider${providerGroupBy(groupByProvider)}
      `
  },
  PasswordResetRequests: (interval, filters) => {
    const { ts, filterSql, groupByProvider } = authQuerySetup(interval, filters)
    return safeSql`
        --password-reset-requests (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragment(groupByProvider)}
          count() as count
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'user_recovery_requested'
        ${filterSql}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  TotalSignUps: (interval, filters) => {
    const { ts, filterSql, groupByProvider } = authQuerySetup(interval, filters)
    return safeSql`
        --total-signups (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragment(groupByProvider)}
          count() as count
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'user_signedup'
        ${filterSql}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignInProcessingTimeBasic: (interval, filters) => {
    const { ts, filterSql, groupByProvider } = authQuerySetup(interval, filters)
    return safeSql`
        --signin-processing-time-basic (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragment(groupByProvider)}
          count() as count,
          round(avg(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as avg_processing_time_ms,
          round(min(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as min_processing_time_ms,
          round(max(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as max_processing_time_ms
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'login'
        ${filterSql}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignInProcessingTimePercentiles: (interval, filters) => {
    const { ts, filterSql, groupByProvider } = authQuerySetup(interval, filters)
    return safeSql`
        --signin-processing-time-percentiles (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragment(groupByProvider)}
          count() as count,
          round(quantile(0.5)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p50_processing_time_ms,
          round(quantile(0.95)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p95_processing_time_ms,
          round(quantile(0.99)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p99_processing_time_ms
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'login'
        ${filterSql}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignUpProcessingTimeBasic: (interval, filters) => {
    const { ts, filterSql, groupByProvider } = authQuerySetup(interval, filters)
    return safeSql`
        --signup-processing-time-basic (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragment(groupByProvider)}
          count() as count,
          round(avg(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as avg_processing_time_ms,
          round(min(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as min_processing_time_ms,
          round(max(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as max_processing_time_ms
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'user_signedup'
        ${filterSql}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  SignUpProcessingTimePercentiles: (interval, filters) => {
    const { ts, filterSql, groupByProvider } = authQuerySetup(interval, filters)
    return safeSql`
        --signup-processing-time-percentiles (otel)
        select
          ${ts} as timestamp,
          ${providerSelectFragment(groupByProvider)}
          count() as count,
          round(quantile(0.5)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p50_processing_time_ms,
          round(quantile(0.95)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p95_processing_time_ms,
          round(quantile(0.99)(toInt64OrZero(JSONExtractString(event_message, 'duration'))) / 1000000, 2) as p99_processing_time_ms
        from logs
        where source = 'auth_logs'
          and JSONExtractString(event_message, 'auth_event', 'action') = 'user_signedup'
        ${filterSql}
        group by ${ts}${providerGroupBy(groupByProvider)}
        order by ${ts} desc${providerGroupBy(groupByProvider)}
      `
  },
  ErrorsByStatus: (interval, filters) => {
    const ts = TIMESTAMP_BUCKET[analyticsIntervalToGranularity(interval)]
    const filterSql = edgeLogsFilterSql(filters)
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
        ${filterSql}
        group by ${ts}, status_code
        order by ${ts} desc
      `
  },
  ErrorsByAuthCode: (interval, filters) => {
    const ts = TIMESTAMP_BUCKET[analyticsIntervalToGranularity(interval)]
    const filterSql = edgeLogsFilterSql(filters)
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
        ${filterSql}
        group by ${ts}, error_code
        order by ${ts} desc
      `
  },
}

export function defaultAuthReportFormatter(
  rawData: unknown,
  attributes: ReportDataProviderAttribute[],
  groupByProvider = false
) {
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

  if (!result) return { data: undefined, chartAttributes: attributes }

  if (groupByProvider) {
    const providers = new Set<string>()
    result.forEach((p: any) => {
      if (p.provider) {
        providers.add(p.provider)
      }
    })

    const providerAttributes: ReportDataProviderAttribute[] = []
    providers.forEach((provider) => {
      attributes.forEach((attr) => {
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
    const timestamps = new Set<string>(result.map((p: any) => String(p.timestamp)))
    const data = Array.from(timestamps)
      .sort()
      .map((timestamp) => {
        const point: any = { timestamp }
        attributes.forEach((attr) => {
          point[attr.attribute] = 0
        })
        const matchingPoints = result.filter((p: any) => String(p.timestamp) === timestamp)

        matchingPoints.forEach((p: any) => {
          attributes.forEach((attr) => {
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
    return { data, chartAttributes: attributes }
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

        const sql = AUTH_REPORT_SQL.ActiveUsers(interval, filters)

        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)

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

        const sql = AUTH_REPORT_SQL.SignInAttempts(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)
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

        const sql = AUTH_REPORT_SQL.TotalSignUps(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)
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

        const sql = AUTH_REPORT_SQL.PasswordResetRequests(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)
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
}): ReportConfig<AuthReportFilters>[] => {
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
        const sql = AUTH_REPORT_SQL.ErrorsByStatus(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)

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
        const sql = AUTH_REPORT_SQL.ErrorsByAuthCode(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)

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
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)
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

        const sql = AUTH_REPORT_SQL.SignInProcessingTimePercentiles(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)
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

        const sql = AUTH_REPORT_SQL.SignUpProcessingTimeBasic(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)
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

        const sql = AUTH_REPORT_SQL.SignUpProcessingTimePercentiles(interval, filters)
        const rawData = await fetchLogs(projectRef, sql, startDate, endDate, true)
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

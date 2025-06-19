import { useQuery } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { AnalyticsInterval } from 'data/analytics/constants'

type BQGranularity = 'second' | 'minute' | 'hour' | 'day' | 'week'
function analyticsIntervalToBQGranularity(interval: AnalyticsInterval): BQGranularity {
  switch (interval) {
    case '1m':
      return 'minute'
    case '5m':
      return 'minute'
    case '10m':
      return 'minute'
    case '30m':
      return 'minute'
    case '1h':
      return 'hour'
    case '1d':
      return 'day'
    default:
      return 'hour'
  }
}

const metricSqlMap: Record<
  string,
  (start: string, end: string, interval: AnalyticsInterval) => string
> = {
  ActiveUsers: (start, end, interval) => {
    const granularity = analyticsIntervalToBQGranularity(interval)
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

  SignInAttempts: (start, end, interval) => {
    const granularity = analyticsIntervalToBQGranularity(interval)
    return `
      --sign-in-attempts
      select 
        timestamp_trunc(timestamp, ${granularity}) as timestamp,
        count(*) as count
      from auth_logs f
      where json_value(f.event_message, "$.action") = 'login'
      group by timestamp
      order by timestamp desc
    `
  },

  PasswordResetRequests: (start, end, interval) => {
    const granularity = analyticsIntervalToBQGranularity(interval)
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

  TotalSignUpsByProvider: (start, end, interval) => `
    -- TODO: Return total sign-ups by provider (email, social, etc.)
  `,
  TotalSignInsByProvider: (start, end, interval) => `
    -- TODO: Return total sign-ins by provider (email, social, etc.)
  `,
  FailedAuthAttempts: (start, end, interval) => `
    -- TODO: Return time series of failed authentication attempts
  `,

  NewUserGrowthRate: (start, end, interval) => `
    -- TODO: Return new user growth rate over time
  `,
  UserRetention: (start, end, interval) => `
    -- TODO: Return user retention/churn metrics
  `,
  SessionsCreated: (start, end, interval) => `
    -- TODO: Return sessions created over time
  `,
  SessionsExpired: (start, end, interval) => `
    -- TODO: Return sessions expired over time
  `,

  SignInLatency: (start, end, interval) => {
    const granularity = analyticsIntervalToBQGranularity(interval)
    return `
      --signin-latency
      select 
        timestamp_trunc(timestamp, ${granularity}) as timestamp,
        json_value(event_message, "$.grant_type") as grant_type,
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms,
        round(min(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as min_latency_ms,
        round(max(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as max_latency_ms,
        round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(50)] / 1000000, 2) as p50_latency_ms,
        round(approx_quantiles(cast(json_value(event_message, "$.duration") as int64), 100)[offset(95)] / 1000000, 2) as p95_latency_ms
      from auth_logs
      where json_value(event_message, "$.path") = '/token'
      group by timestamp, grant_type
      order by timestamp desc, grant_type
    `
  },

  SignUpLatency: (start, end, interval) => {
    const granularity = analyticsIntervalToBQGranularity(interval)
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

  TokenRefreshLatency: (start, end, interval) => `
    -- TODO: Return token refresh operation latency over time
  `,
  TokenVerificationSpeed: (start, end, interval) => `
    -- TODO: Return token verification speed over time
  `,
  AuthProviderResponseTimes: (start, end, interval) => `
    -- TODO: Return auth provider response times (by provider)
  `,

  SuspiciousActivity: (start, end, interval) => `
    -- TODO: Return suspicious activity (multiple failed attempts, unusual locations, etc.)
  `,
  RateLimitedRequests: (start, end, interval) => `
    -- TODO: Return rate limited requests over time
  `,
  TokenRevocations: (start, end, interval) => `
    -- TODO: Return token revocations over time
  `,
  MFAUsage: (start, end, interval) => `
    -- TODO: Return MFA usage statistics over time
  `,
  ErrorsByStatus: (start, end, interval) => {
    const granularity = analyticsIntervalToBQGranularity(interval)
    return `
      --auth-errors-by-status
      select 
        timestamp_trunc(timestamp, ${granularity}) as timestamp,
        json_value(event_message, "$.status") as status_code,
        json_value(event_message, "$.path") as path,
        json_value(event_message, "$.method") as method,
        count(*) as count
      from auth_logs
      where json_value(event_message, "$.status") in ('403', '404', '422', '429', '500')
      group by timestamp, status_code, path, method
      order by timestamp desc, status_code
    `
  },
}

export function useAuthReport({
  projectRef,
  metricKey,
  startDate,
  endDate,
  interval,
  enabled = true,
}: {
  projectRef: string
  metricKey: string
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  enabled?: boolean
}) {
  const sql = metricSqlMap[metricKey]?.(startDate, endDate, interval)

  const _enabled = Boolean(projectRef && sql && enabled)

  const { data, error, isLoading } = useQuery(
    ['auth-metrics', projectRef, metricKey, startDate, endDate, interval, sql],
    async () => {
      const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
        params: {
          path: { ref: projectRef },
          query: {
            sql,
            project: projectRef,
            iso_timestamp_start: startDate,
            iso_timestamp_end: endDate,
          },
        },
      })
      if (error) throw error
      // Format result for chart: [{ period_start, [metricKey]: count }]
      const formatted = (data?.result || []).map((row: any) => ({
        period_start: row.timestamp,
        [metricKey]: row.count,
      }))
      return formatted
    },
    {
      enabled: _enabled,
      refetchOnWindowFocus: false,
    }
  )

  return {
    isLoading,
    error,
    data,
  }
}

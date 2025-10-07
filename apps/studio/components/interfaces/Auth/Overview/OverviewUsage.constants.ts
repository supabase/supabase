import dayjs from 'dayjs'
import { fetchLogs } from 'data/reports/report.utils'

// Date range helpers
export const getDateRanges = () => {
  const endDate = dayjs().toISOString()
  const startDate = dayjs().subtract(24, 'hour').toISOString()
  const previousEndDate = dayjs().subtract(24, 'hour').toISOString()
  const previousStartDate = dayjs().subtract(48, 'hour').toISOString()

  return {
    current: { startDate, endDate },
    previous: { startDate: previousStartDate, endDate: previousEndDate },
  }
}

export const AUTH_COMBINED_QUERY = () => `
  with base as (
    select
      timestamp_trunc(timestamp, hour) as ts_hour,
      json_value(event_message, "$.auth_event.action") as action,
      json_value(event_message, "$.auth_event.actor_id") as actor_id,
      cast(json_value(event_message, "$.duration") as int64) as duration_ns
    from auth_logs
  ),
  agg as (
    select
      ts_hour,
      count(distinct case 
        when action in (
          'login','user_signedup','token_refreshed','user_modified',
          'user_recovery_requested','user_reauthenticate_requested'
        ) then actor_id 
        else null 
      end) as active_users,
      count(case when action = 'user_recovery_requested' then 1 else null end) as password_reset_requests,
      count(case when action = 'user_signedup' then 1 else null end) as signups,
      round(avg(case when action = 'login' then duration_ns else null end) / 1000000, 2) as signin_avg_ms,
      round(avg(case when action = 'user_signedup' then duration_ns else null end) / 1000000, 2) as signup_avg_ms
    from base
    group by ts_hour
  )
  
  select ts_hour as timestamp, 'activeUsers' as metric, cast(active_users as float64) as value
  from agg
  union all
  select ts_hour, 'passwordResetRequests' as metric, cast(password_reset_requests as float64)
  from agg
  union all
  select ts_hour, 'signUpCount' as metric, cast(signups as float64)
  from agg
  union all
  select ts_hour, 'signInLatency' as metric, coalesce(signin_avg_ms, 0)
  from agg
  union all
  select ts_hour, 'signUpLatency' as metric, coalesce(signup_avg_ms, 0)
  from agg
  order by timestamp desc, metric
`

export const fetchAllAuthMetrics = async (projectRef: string, period: 'current' | 'previous') => {
  const sql = AUTH_COMBINED_QUERY()
  const { current, previous } = getDateRanges()
  const dateRange = period === 'current' ? current : previous

  return await fetchLogs(projectRef, sql, dateRange.startDate, dateRange.endDate)
}

export const processAllAuthMetrics = (currentData: any[], previousData: any[]) => {
  const processData = (data: any[]) => {
    if (!data || !Array.isArray(data)) {
      return { activeUsers: 0, passwordResets: 0, signInLatency: 0, signUpLatency: 0 }
    }

    const grouped = data.reduce(
      (acc, row) => {
        const { metric, value } = row
        if (!acc[metric]) acc[metric] = []
        acc[metric].push(value || 0)
        return acc
      },
      {} as Record<string, number[]>
    )

    return {
      activeUsers: (grouped.activeUsers || []).reduce((sum: number, v: number) => sum + v, 0),
      passwordResets: (grouped.passwordResetRequests || []).reduce(
        (sum: number, v: number) => sum + v,
        0
      ),
      signInLatency:
        (grouped.signInLatency || []).length > 0
          ? (grouped.signInLatency || []).reduce((sum: number, v: number) => sum + v, 0) /
            grouped.signInLatency.length
          : 0,
      signUpLatency:
        (grouped.signUpLatency || []).length > 0
          ? (grouped.signUpLatency || []).reduce((sum: number, v: number) => sum + v, 0) /
            grouped.signUpLatency.length
          : 0,
    }
  }

  return {
    current: processData(currentData),
    previous: processData(previousData),
  }
}

// Utility functions
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const getChangeColor = (percentageChange: number): string => {
  return percentageChange >= 0 ? 'text-brand' : 'text-destructive'
}

export const getChangeSign = (percentageChange: number): string => {
  return percentageChange >= 0 ? '+' : ''
}

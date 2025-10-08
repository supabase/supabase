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
      json_value(event_message, "$.auth_event.action") as action,
      json_value(event_message, "$.auth_event.actor_id") as actor_id,
      cast(json_value(event_message, "$.duration") as int64) as duration_ns
    from auth_logs
  )
  
  select 
    'activeUsers' as metric, 
    cast(count(distinct case 
      when action in (
        'login','user_signedup','token_refreshed','user_modified',
        'user_recovery_requested','user_reauthenticate_requested'
      ) then actor_id 
      else null 
    end) as float64) as value
  from base
  
  union all
  select 'passwordResetRequests' as metric, 
    cast(count(case when action = 'user_recovery_requested' then 1 else null end) as float64)
  from base
  
  union all
  select 'signUpCount' as metric, 
    cast(count(case when action = 'user_signedup' then 1 else null end) as float64)
  from base
  
  union all
  select 'signInLatency' as metric, 
    coalesce(round(avg(case when action = 'login' then duration_ns else null end) / 1000000, 2), 0)
  from base
  
  union all
  select 'signUpLatency' as metric, 
    coalesce(round(avg(case when action = 'user_signedup' then duration_ns else null end) / 1000000, 2), 0)
  from base
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

    const result = data.reduce(
      (acc, row) => {
        const { metric, value } = row
        if (metric === 'activeUsers') acc.activeUsers = value || 0
        if (metric === 'passwordResetRequests') acc.passwordResets = value || 0
        if (metric === 'signInLatency') acc.signInLatency = value || 0
        if (metric === 'signUpLatency') acc.signUpLatency = value || 0
        return acc
      },
      { activeUsers: 0, passwordResets: 0, signInLatency: 0, signUpLatency: 0 }
    )

    return result
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

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
-- auth-overview
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
  select 'apiTotalRequests' as metric,
    cast(count(*) as float64) as value
  from edge_logs
    cross join unnest(metadata) as m
    cross join unnest(m.request) as request
    cross join unnest(m.response) as response
    cross join unnest(response.headers) as h
  where path like '%auth/v1%'

  union all
  select 'apiErrorRequests' as metric,
    cast(count(*) as float64) as value
  from edge_logs
    cross join unnest(metadata) as m
    cross join unnest(m.request) as request
    cross join unnest(m.response) as response
    cross join unnest(response.headers) as h
  where path like '%auth/v1%'
    and response.status_code >= 400 and response.status_code <= 599

  union all
  select 'authErrorRequests' as metric,
    cast(count(*) as float64) as value
  from edge_logs
    cross join unnest(metadata) as m
    cross join unnest(m.request) as request
    cross join unnest(m.response) as response
    cross join unnest(response.headers) as h
  where path like '%auth/v1%'
    and response.status_code >= 400 and response.status_code <= 599
    and h.x_sb_error_code is not null
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
      return { activeUsers: 0, signUps: 0, apiErrorRate: 0, authErrorRate: 0 }
    }

    const result = data.reduce(
      (acc, row) => {
        const { metric, value } = row
        if (metric === 'activeUsers') acc.activeUsers = value || 0
        if (metric === 'signUpCount') acc.signUps = value || 0
        if (metric === 'apiTotalRequests') acc._apiTotal = value || 0
        if (metric === 'apiErrorRequests') acc._apiErrors = value || 0
        if (metric === 'authErrorRequests') acc._authErrors = value || 0
        return acc
      },
      { activeUsers: 0, signUps: 0, _apiTotal: 0, _apiErrors: 0, _authErrors: 0 } as any
    )

    const apiErrorRate = result._apiTotal > 0 ? (result._apiErrors / result._apiTotal) * 100 : 0
    const authErrorRate = result._apiTotal > 0 ? (result._authErrors / result._apiTotal) * 100 : 0

    return {
      activeUsers: result.activeUsers,
      signUps: result.signUps,
      apiErrorRate,
      authErrorRate,
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

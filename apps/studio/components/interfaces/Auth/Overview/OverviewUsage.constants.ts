import dayjs from 'dayjs'
import { fetchLogs } from 'data/reports/report.utils'

export interface AuthStats {
  activeUsers: { current: number; previous: number }
  passwordResetRequests: { current: number; previous: number }
  signInLatency: { current: number; previous: number }
  signUpLatency: { current: number; previous: number }
}

export interface StatCardProps {
  title: string
  current: number
  previous: number
  loading?: boolean
  suffix?: string
}

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

// SQL Queries - Updated to return time-series data like the working auth reports
export const AUTH_QUERIES = {
  activeUsers: {
    current: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        count(distinct json_value(f.event_message, "$.auth_event.actor_id")) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") in (
        'login', 'user_signedup', 'token_refreshed', 'user_modified',
        'user_recovery_requested', 'user_reauthenticate_requested'
      )
      group by timestamp
      order by timestamp desc
    `,
    previous: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        count(distinct json_value(f.event_message, "$.auth_event.actor_id")) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") in (
        'login', 'user_signedup', 'token_refreshed', 'user_modified',
        'user_recovery_requested', 'user_reauthenticate_requested'
      )
      group by timestamp
      order by timestamp desc
    `,
  },

  passwordResetRequests: {
    current: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        count(*) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") = 'user_recovery_requested'
      group by timestamp
      order by timestamp desc
    `,
    previous: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        count(*) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") = 'user_recovery_requested'
      group by timestamp
      order by timestamp desc
    `,
  },

  signUpCount: {
    current: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        count(*) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") = 'user_signedup'
      group by timestamp
      order by timestamp desc
    `,
    previous: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        count(*) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") = 'user_signedup'
      group by timestamp
      order by timestamp desc
    `,
  },

  signInLatency: {
    current: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'login'
      group by timestamp
      order by timestamp desc
    `,
    previous: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'login'
      group by timestamp
      order by timestamp desc
    `,
  },

  signUpLatency: {
    current: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'user_signedup'
      group by timestamp
      order by timestamp desc
    `,
    previous: () => `
      select 
        timestamp_trunc(timestamp, hour) as timestamp,
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'user_signedup'
      group by timestamp
      order by timestamp desc
    `,
  },
}

export const fetchAuthData = async (
  projectRef: string,
  queryType:
    | 'activeUsersCurrent'
    | 'activeUsersPrevious'
    | 'passwordResetCurrent'
    | 'passwordResetPrevious'
    | 'signUpCountCurrent'
    | 'signUpCountPrevious'
    | 'signInLatencyCurrent'
    | 'signInLatencyPrevious'
    | 'signUpLatencyCurrent'
    | 'signUpLatencyPrevious'
) => {
  const { current, previous } = getDateRanges()

  let sql: string
  let dateRange: { startDate: string; endDate: string }

  switch (queryType) {
    case 'activeUsersCurrent':
      sql = AUTH_QUERIES.activeUsers.current()
      dateRange = current
      break
    case 'activeUsersPrevious':
      sql = AUTH_QUERIES.activeUsers.previous()
      dateRange = previous
      break
    case 'passwordResetCurrent':
      sql = AUTH_QUERIES.passwordResetRequests.current()
      dateRange = current
      break
    case 'passwordResetPrevious':
      sql = AUTH_QUERIES.passwordResetRequests.previous()
      dateRange = previous
      break
    case 'signUpCountCurrent':
      sql = AUTH_QUERIES.signUpCount.current()
      dateRange = current
      break
    case 'signUpCountPrevious':
      sql = AUTH_QUERIES.signUpCount.previous()
      dateRange = previous
      break
    case 'signInLatencyCurrent':
      sql = AUTH_QUERIES.signInLatency.current()
      dateRange = current
      break
    case 'signInLatencyPrevious':
      sql = AUTH_QUERIES.signInLatency.previous()
      dateRange = previous
      break
    case 'signUpLatencyCurrent':
      sql = AUTH_QUERIES.signUpLatency.current()
      dateRange = current
      break
    case 'signUpLatencyPrevious':
      sql = AUTH_QUERIES.signUpLatency.previous()
      dateRange = previous
      break
    default:
      throw new Error(`Unknown query type: ${queryType}`)
  }

  return await fetchLogs(projectRef, sql, dateRange.startDate, dateRange.endDate)
}

export const sumTimeSeriesData = (data: any[], field: string): number => {
  if (!data || !Array.isArray(data)) return 0
  return data.reduce((sum, item) => sum + (item[field] || 0), 0)
}

export const averageTimeSeriesData = (data: any[], field: string): number => {
  if (!data || !Array.isArray(data) || data.length === 0) return 0
  const sum = data.reduce((sum, item) => sum + (item[field] || 0), 0)
  return sum / data.length
}

// Utility functions
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const formatStatValue = (value: number, suffix: string = ''): string => {
  return `${value.toLocaleString()}${suffix}`
}

export const getChangeColor = (percentageChange: number): string => {
  return percentageChange >= 0 ? 'text-brand' : 'text-destructive'
}

export const getChangeSign = (percentageChange: number): string => {
  return percentageChange >= 0 ? '+' : ''
}

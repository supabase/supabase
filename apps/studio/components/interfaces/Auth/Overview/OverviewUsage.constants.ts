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

// SQL Queries - Updated to match the working auth report structure (no manual date filtering)
export const AUTH_QUERIES = {
  activeUsers: {
    current: () => `
      select 
        count(distinct json_value(f.event_message, "$.auth_event.actor_id")) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") in (
        'login', 'user_signedup', 'token_refreshed', 'user_modified',
        'user_recovery_requested', 'user_reauthenticate_requested'
      )
    `,
    previous: () => `
      select 
        count(distinct json_value(f.event_message, "$.auth_event.actor_id")) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") in (
        'login', 'user_signedup', 'token_refreshed', 'user_modified',
        'user_recovery_requested', 'user_reauthenticate_requested'
      )
    `,
  },

  passwordResetRequests: {
    current: () => `
      select 
        count(*) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") = 'user_recovery_requested'
    `,
    previous: () => `
      select 
        count(*) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") = 'user_recovery_requested'
    `,
  },

  signInLatency: {
    current: () => `
      select 
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'login'
    `,
    previous: () => `
      select 
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'login'
    `,
  },

  signUpLatency: {
    current: () => `
      select 
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'user_signedup'
    `,
    previous: () => `
      select 
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'user_signedup'
    `,
  },
}

// Function to fetch auth data using the analytics endpoint
export const fetchAuthData = async (
  projectRef: string,
  queryType:
    | 'activeUsersCurrent'
    | 'activeUsersPrevious'
    | 'passwordResetCurrent'
    | 'passwordResetPrevious'
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

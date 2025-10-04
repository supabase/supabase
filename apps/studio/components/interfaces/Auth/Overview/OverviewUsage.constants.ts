import dayjs from 'dayjs'

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

// SQL Queries - Updated to match the working auth report structure
export const AUTH_QUERIES = {
  activeUsers: {
    current: (startDate: string, endDate: string) => `
      select 
        count(distinct json_value(f.event_message, "$.auth_event.actor_id")) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") in (
        'login', 'user_signedup', 'token_refreshed', 'user_modified',
        'user_recovery_requested', 'user_reauthenticate_requested'
      )
      and timestamp >= '${startDate}' and timestamp <= '${endDate}'
    `,
    previous: (startDate: string, endDate: string) => `
      select 
        count(distinct json_value(f.event_message, "$.auth_event.actor_id")) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") in (
        'login', 'user_signedup', 'token_refreshed', 'user_modified',
        'user_recovery_requested', 'user_reauthenticate_requested'
      )
      and timestamp >= '${startDate}' and timestamp <= '${endDate}'
    `,
  },

  passwordResetRequests: {
    current: (startDate: string, endDate: string) => `
      select 
        count(*) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") = 'user_recovery_requested'
      and timestamp >= '${startDate}' and timestamp <= '${endDate}'
    `,
    previous: (startDate: string, endDate: string) => `
      select 
        count(*) as count
      from auth_logs f
      where json_value(f.event_message, "$.auth_event.action") = 'user_recovery_requested'
      and timestamp >= '${startDate}' and timestamp <= '${endDate}'
    `,
  },

  signInLatency: {
    current: (startDate: string, endDate: string) => `
      select 
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'login'
      and timestamp >= '${startDate}' and timestamp <= '${endDate}'
    `,
    previous: (startDate: string, endDate: string) => `
      select 
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'login'
      and timestamp >= '${startDate}' and timestamp <= '${endDate}'
    `,
  },

  signUpLatency: {
    current: (startDate: string, endDate: string) => `
      select 
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'user_signedup'
      and timestamp >= '${startDate}' and timestamp <= '${endDate}'
    `,
    previous: (startDate: string, endDate: string) => `
      select 
        round(avg(cast(json_value(event_message, "$.duration") as int64)) / 1000000, 2) as avg_latency_ms
      from auth_logs
      where json_value(event_message, "$.auth_event.action") = 'user_signedup'
      and timestamp >= '${startDate}' and timestamp <= '${endDate}'
    `,
  },
}

export const executeAuthQueries = (projectRef: string) => {
  if (!projectRef) {
    throw new Error('Project reference is required')
  }

  const { current, previous } = getDateRanges()

  const queries = [
    {
      key: 'activeUsersCurrent',
      sql: AUTH_QUERIES.activeUsers.current(current.startDate, current.endDate),
    },
    {
      key: 'activeUsersPrevious',
      sql: AUTH_QUERIES.activeUsers.previous(previous.startDate, previous.endDate),
    },
    {
      key: 'passwordResetCurrent',
      sql: AUTH_QUERIES.passwordResetRequests.current(current.startDate, current.endDate),
    },
    {
      key: 'passwordResetPrevious',
      sql: AUTH_QUERIES.passwordResetRequests.previous(previous.startDate, previous.endDate),
    },
    {
      key: 'signInLatencyCurrent',
      sql: AUTH_QUERIES.signInLatency.current(current.startDate, current.endDate),
    },
    {
      key: 'signInLatencyPrevious',
      sql: AUTH_QUERIES.signInLatency.previous(previous.startDate, previous.endDate),
    },
    {
      key: 'signUpLatencyCurrent',
      sql: AUTH_QUERIES.signUpLatency.current(current.startDate, current.endDate),
    },
    {
      key: 'signUpLatencyPrevious',
      sql: AUTH_QUERIES.signUpLatency.previous(previous.startDate, previous.endDate),
    },
  ]

  return queries
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

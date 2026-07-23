import type { BadgeProps } from 'ui'

import type { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'

export type UserActivityLevel = 'success' | 'warning' | 'error'

export interface UserActivityEvent {
  id: string
  timestamp: string
  logType: string
  eventMessage: string
  method: string | null
  pathname: string | null
  status: number | null
  level: UserActivityLevel
}

/** Row shape returned by `getUnifiedLogs()` (data/logs/unified-logs-infinite-query.ts). */
interface UnifiedLogRow {
  id: string
  timestamp: string
  event_message: string
  log_type: string
  method: string | null
  pathname: string | null
  status: number | null
  level: UserActivityLevel
}

export const mapLogRowToActivityEvent = (row: UnifiedLogRow): UserActivityEvent => ({
  id: row.id,
  timestamp: row.timestamp,
  logType: row.log_type,
  eventMessage: row.event_message,
  method: row.method,
  pathname: row.pathname,
  status: row.status,
  level: row.level,
})

/**
 * Builds a fully valid `QuerySearchParamsType` for `useUnifiedLogsInfiniteQuery` without
 * pulling in UnifiedLogs' own nuqs URL-param machinery — this page only needs the user and
 * date range to vary, so the rest are fixed to their SEARCH_PARAMS_PARSER defaults.
 */
export const buildUserActivitySearch = ({
  user,
  date,
}: {
  user: string
  date: [Date, Date]
}): QuerySearchParamsType => ({
  filter: null,
  latency: null,
  'timing.dns': null,
  'timing.connection': null,
  'timing.tls': null,
  'timing.ttfb': null,
  'timing.transfer': null,
  date,
  sort: null,
  size: 40,
  start: 0,
  direction: 'next',
  cursor: new Date(),
  id: null,
  show_connection_logs: true,
  edge_auth: true,
  edge_storage: true,
  edge_postgrest: true,
  user,
})

/** Tailwind background class for an event's timeline dot, keyed by severity. */
export const LEVEL_DOT_COLOR: Record<UserActivityLevel, string> = {
  success: 'bg-brand',
  warning: 'bg-warning-600',
  error: 'bg-destructive-600',
}

export const isErrorLevel = (level: UserActivityLevel) => level === 'error'

/** Map an event's derived severity level to a Badge variant. */
export const levelBadgeVariant = (level: UserActivityLevel): BadgeProps['variant'] => {
  if (level === 'error') return 'destructive'
  if (level === 'warning') return 'warning'
  return 'success'
}

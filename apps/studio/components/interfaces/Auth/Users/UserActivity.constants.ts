import type { BadgeProps } from 'ui'

import type { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'

export type UserActivityLevel = 'success' | 'warning' | 'error'

export interface UserActivityLogEntry {
  id: string
  timestamp: string
  event_message: string
  level: string
  event_type: string
}

export interface UserActivityEvent {
  id: string
  /** Epoch milliseconds — sourced from the row's already-parsed `date`, not the raw `timestamp`
   * (which can be an epoch-microseconds string or an ISO string depending on the log source). */
  timestampMs: number
  logType: string
  eventMessage: string
  method: string | null
  pathname: string | null
  status: number | null
  level: UserActivityLevel
  headers: Record<string, unknown>
  logs: UserActivityLogEntry[]
}

/** Row shape returned by `getUnifiedLogs()` (data/logs/unified-logs-infinite-query.ts). */
interface UnifiedLogRow {
  id: string
  date: Date
  event_message: string
  log_type: string
  method: string | null
  pathname: string | null
  status: number | null
  level: UserActivityLevel
  headers: Record<string, unknown>
  logs: UserActivityLogEntry[]
}

export const mapLogRowToActivityEvent = (row: UnifiedLogRow): UserActivityEvent => ({
  id: row.id,
  timestampMs: row.date.getTime(),
  logType: row.log_type,
  eventMessage: row.event_message,
  method: row.method,
  pathname: row.pathname,
  status: row.status,
  level: row.level,
  headers: row.headers ?? {},
  logs: row.logs ?? [],
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

/**
 * Pathnames collapsed into an "N omitted events" summary in the activity timeline. These fire
 * often enough on their own (e.g. silent token refreshes hitting `/token`) that showing every
 * occurrence would drown out the rest of a user's activity.
 */
export const NOISY_EVENT_PATHNAMES: readonly string[] = ['/token']

/** Map an event's derived severity level to a Badge variant. */
export const levelBadgeVariant = (level: UserActivityLevel): BadgeProps['variant'] => {
  if (level === 'error') return 'destructive'
  if (level === 'warning') return 'warning'
  return 'success'
}

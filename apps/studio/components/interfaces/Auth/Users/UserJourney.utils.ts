/**
 * UserJourney.utils — pure helpers for the User Journey tab.
 *
 * These build the logs SQL, classify raw auth/edge log rows into journey
 * events, and merge them chronologically. Kept free of React so they can be
 * unit-tested in isolation (see studio-testing conventions).
 *
 * DATA-AVAILABILITY NOTE: the logs give us the auth timeline (auth_logs) and
 * per-user API activity with method/path/status (edge_logs, filtered on the
 * caller's JWT `auth_user`). What they do NOT give us is the exact RLS policy
 * that denied a write — Postgres' RLS error names the table, never the policy,
 * and there's no request id joining an edge_logs row to a postgres_logs row.
 * So a 403 on a `/rest/v1/*` write is surfaced as "likely blocked by RLS" with
 * the table inferred from the path, and the policy name is left unknown.
 */
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'

export type JourneyEventStatus = 'success' | 'neutral' | 'error'
export type JourneyEventSource = 'auth' | 'postgrest'

export interface JourneyEvent {
  id: string
  /** ISO string (sample data) or unix microseconds (live logs) — both render via TimestampInfo. */
  timestamp: string | number
  source: JourneyEventSource
  status: JourneyEventStatus
  title: string
  description: string
  request?: { method: string; path: string; statusCode: number }
  error?: { message: string; policy?: string; table?: string; policyUnknown?: boolean }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isValidUserId = (userId?: string | null): userId is string =>
  !!userId && UUID_RE.test(userId)

/** Last meaningful path segment, e.g. `/rest/v1/orders?select=*` → `orders`. */
const resourceFromPath = (path: string) => {
  const clean = path.split('?')[0].replace(/\/+$/, '')
  const segments = clean.split('/').filter(Boolean)
  return segments[segments.length - 1] || clean || 'resource'
}

/**
 * SQL to pull this user's auth events. Matched on the user id appearing in the
 * raw event message — the same heuristic the Logs tab uses (`search_query`).
 */
export const buildAuthLogsSql = (userId: string, useOtel: boolean, limit = 50) => {
  if (useOtel) {
    return `select
  id,
  timestamp,
  event_message,
  log_attributes['level'] as level,
  log_attributes['status'] as status,
  log_attributes['path'] as path,
  log_attributes['msg'] as msg
from logs
where source = 'auth_logs'
  and event_message ilike '%${userId}%'
order by timestamp desc
limit ${limit}`
  }
  return `select
  id,
  timestamp,
  event_message,
  metadata.level as level,
  metadata.status as status,
  metadata.path as path,
  metadata.msg as msg
from auth_logs
cross join unnest(metadata) as metadata
where regexp_contains(event_message, '${userId}')
order by timestamp desc
limit ${limit}`
}

/**
 * SQL to pull this user's API activity from the edge gateway, filtered on the
 * JWT `auth_user` (the acting user's id) carried on each request.
 *
 * The OTEL/ClickHouse `log_attributes` key for auth_user is the BigQuery path
 * with the `metadata` root dropped; if it ever returns nothing on a ClickHouse
 * project, confirm the key via the Field Reference drawer / `mapKeys`.
 */
export const buildEdgeLogsSql = (userId: string, useOtel: boolean, limit = 50) => {
  if (useOtel) {
    return `select
  id,
  timestamp,
  log_attributes['request.method'] as method,
  log_attributes['request.path'] as path,
  log_attributes['response.status_code'] as status_code
from logs
where source = 'edge_logs'
  and log_attributes['request.sb.auth_user'] = '${userId}'
order by timestamp desc
limit ${limit}`
  }
  return `select
  id,
  timestamp,
  request.method as method,
  request.path as path,
  response.status_code as status_code
from edge_logs
cross join unnest(metadata) as m
cross join unnest(m.request) as request
cross join unnest(m.response) as response
cross join unnest(request.sb) as sb
where sb.auth_user = '${userId}'
order by timestamp desc
limit ${limit}`
}

const toSortableTimestamp = (timestamp: string | number) =>
  typeof timestamp === 'number' ? timestamp : Date.parse(timestamp)

export const classifyAuthLog = (log: LogData): JourneyEvent => {
  const msg = String(log.msg ?? log.event_message ?? '')
  const path = String(log.path ?? '')
  const level = String(log.level ?? '').toLowerCase()
  const haystack = `${msg} ${path}`.toLowerCase()
  const isError = level === 'error' || level === 'fatal'

  let title = 'Authentication event'
  if (haystack.includes('signup') || haystack.includes('sign up')) title = 'Signed up'
  else if (haystack.includes('token') || haystack.includes('login')) title = 'Authenticated'
  else if (haystack.includes('logout')) title = 'Signed out'
  else if (haystack.includes('recover')) title = 'Password recovery'

  return {
    id: String(log.id),
    timestamp: log.timestamp,
    source: 'auth',
    status: isError ? 'error' : 'success',
    title,
    description: `Auth · ${msg || path || 'event'}`,
    ...(isError && { error: { message: msg || 'Authentication error' } }),
  }
}

export const classifyEdgeLog = (log: LogData): JourneyEvent => {
  const method = String(log.method ?? '').toUpperCase()
  const path = String(log.path ?? '')
  const statusCode = Number(log.status_code ?? 0)
  const resource = resourceFromPath(path)
  const isError = statusCode >= 400
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  let title: string
  if (isError) title = isWrite ? 'Write blocked' : 'Request failed'
  else if (method === 'GET') title = `Read ${resource}`
  else if (method === 'POST') title = `Created ${resource}`
  else if (method === 'PATCH' || method === 'PUT') title = `Updated ${resource}`
  else if (method === 'DELETE') title = `Deleted ${resource}`
  else title = `${method || 'Request'} ${resource}`.trim()

  const event: JourneyEvent = {
    id: String(log.id),
    timestamp: log.timestamp,
    source: 'postgrest',
    status: isError ? 'error' : 'neutral',
    title,
    description: `PostgREST · ${method || 'request'}`,
    ...(path && { request: { method, path, statusCode } }),
  }

  if (isError) {
    const likelyRls = statusCode === 403 && path.includes('/rest/')
    event.error = {
      message: likelyRls
        ? 'Request denied — likely blocked by a row-level security policy'
        : `Request failed with status ${statusCode}`,
      ...(likelyRls && { table: resource, policyUnknown: true }),
    }
  }

  return event
}

/** Merge auth + edge rows into a single chronological (oldest → newest) timeline. */
export const buildJourney = (authLogs: LogData[], edgeLogs: LogData[]): JourneyEvent[] => {
  return [...authLogs.map(classifyAuthLog), ...edgeLogs.map(classifyEdgeLog)].sort(
    (a, b) => toSortableTimestamp(a.timestamp) - toSortableTimestamp(b.timestamp)
  )
}

/**
 * Hardcoded reference scenario (mirrors a real support case). Used by the
 * "Sample data" toggle so the tab is demoable on projects with no matching logs.
 */
export const SAMPLE_JOURNEY_EVENTS: JourneyEvent[] = [
  {
    id: 'sample-1',
    timestamp: '2026-07-13T09:41:02.118Z',
    source: 'auth',
    status: 'success',
    title: 'Signed up',
    description: 'Auth · new user created via email signup',
  },
  {
    id: 'sample-2',
    timestamp: '2026-07-13T09:41:02.421Z',
    source: 'auth',
    status: 'success',
    title: 'Authenticated',
    description: 'Auth · session issued, JWT minted',
  },
  {
    id: 'sample-3',
    timestamp: '2026-07-13T09:41:03.905Z',
    source: 'postgrest',
    status: 'neutral',
    title: 'Read profile',
    description: 'PostgREST · fetched the current user profile',
    request: { method: 'GET', path: '/rest/v1/profiles', statusCode: 200 },
  },
  {
    id: 'sample-4',
    timestamp: '2026-07-13T09:41:05.332Z',
    source: 'postgrest',
    status: 'neutral',
    title: 'Created order',
    description: 'PostgREST · inserted a new order row',
    request: { method: 'POST', path: '/rest/v1/orders', statusCode: 201 },
  },
  {
    id: 'sample-5',
    timestamp: '2026-07-13T09:41:06.744Z',
    source: 'postgrest',
    status: 'error',
    title: 'Write blocked',
    description: 'PostgREST · insert rejected before reaching the table',
    request: { method: 'POST', path: '/rest/v1/payments', statusCode: 403 },
    error: {
      message: 'Denied by RLS policy',
      policy: 'payments_insert_owner',
      table: 'payments',
    },
  },
]

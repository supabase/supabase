import { parseOtelTimestamp } from './otel-inspection.utils'
import { tryParseJson } from '@/lib/helpers'

type UnifiedLogMetadataRow = {
  log_type?: string | null
  status?: string | number | null
  method?: string | null
  pathname?: string | null
  url?: string | null
  event_message?: string | null
}

export type UnifiedLogsQueryRow = UnifiedLogMetadataRow & {
  id: string
  timestamp: string | number
  level?: string | null
  host?: string | null
  body?: string | null
  headers?: string | Record<string, unknown> | null
  region?: string | null
  latency?: number | null
  log_count?: number | null
  logs?: unknown[] | null
  auth_user?: string | null
  metadata?: Record<string, unknown> | null
  project?: string | null
}

const extractLeadingStatus = (s?: string) => {
  const m = typeof s === 'string' ? s.match(/^(\d{3})\b/) : null
  return m ? Number(m[1]) : undefined
}

export const extractLogMetadata = (row: UnifiedLogMetadataRow) => {
  if (row.log_type === 'workers') {
    return { status: null, method: null, pathname: null }
  }

  // [Joshen] For auth logs, these metadata are nested within event_message,
  // so opting to bring them out at the query level
  const eventMessage = tryParseJson(row.event_message)
  const status =
    row.log_type === 'auth'
      ? (eventMessage?.status ??
        extractLeadingStatus(eventMessage?.msg) ??
        extractLeadingStatus(eventMessage?.error))
      : (row.status ?? 200)
  const method = row.log_type === 'auth' ? eventMessage?.method : row.method
  const pathname =
    row.log_type === 'auth'
      ? eventMessage?.path
      : (row.url || '').replace(/^https?:\/\/[^\/]+/, '') || row.pathname || ''

  return { status, method, pathname }
}

export const mapUnifiedLogRow = (row: UnifiedLogsQueryRow) => {
  const isWorkersLog = row.log_type === 'workers'
  const { status, method, pathname } = extractLogMetadata(row)

  const mappedRow = {
    id: row.id,
    date: parseOtelTimestamp(row.timestamp),
    method,
    pathname,
    status,
    timestamp: row.timestamp,
    level: isWorkersLog ? null : row.level,
    host: row.host,
    event_message: row.event_message || row.body || '',
    headers: typeof row.headers === 'string' ? JSON.parse(row.headers || '{}') : row.headers || {},
    regions: row.region ? [row.region] : [],
    log_type: row.log_type || '',
    latency: row.latency || 0,
    log_count: row.log_count || null,
    logs: row.logs || [],
    auth_user: isWorkersLog ? null : row.auth_user || null,
  }

  if (isWorkersLog) return { ...mappedRow, metadata: row.metadata ?? null }
  return mappedRow
}

export const isUnifiedLogsQueryRow = (value: unknown): value is UnifiedLogsQueryRow => {
  if (typeof value !== 'object' || value === null) return false
  if (!('id' in value) || typeof value.id !== 'string') return false
  if (!('timestamp' in value)) return false
  return typeof value.timestamp === 'string' || typeof value.timestamp === 'number'
}

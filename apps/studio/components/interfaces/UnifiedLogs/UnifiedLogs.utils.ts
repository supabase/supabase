import { type Table as TTable } from '@tanstack/react-table'
import { cn } from 'ui'

import { LOG_TYPES_LABELS } from './UnifiedLogs.constants'
import { FacetMetadataSchema } from './UnifiedLogs.schema'
import { LEVELS } from '@/components/ui/DataTable/DataTable.constants'
import { Option } from '@/components/ui/DataTable/DataTable.types'

export type UnifiedLogType = keyof typeof LOG_TYPES_LABELS

export const buildUnifiedLogsUrl = ({
  projectRef,
  logType,
  user,
  start,
  end,
}: {
  projectRef: string
  logType?: UnifiedLogType
  /** Pre-applies the cross-cutting "filter by user" (?user=) — an id or email. */
  user?: string
  start?: string | Date
  end?: string | Date
}) => {
  const params = new URLSearchParams()
  if (logType) params.append('filter', `log_type:eq:${logType}`)
  if (user) params.set('user', user)
  if (start && end) {
    params.set('date', `${new Date(start).valueOf()}-${new Date(end).valueOf()}`)
  }
  return `/project/${projectRef}/logs?${params.toString()}`
}

export const getFacetedUniqueValues = <TData>(facets?: Record<string, FacetMetadataSchema>) => {
  return (_table: TTable<TData>, columnId: string) => {
    return new Map(facets?.[columnId]?.rows?.map(({ value, total }) => [value, total]) || [])
  }
}

export const getFacetedMinMaxValues = <TData>(facets?: Record<string, FacetMetadataSchema>) => {
  return (_table: TTable<TData>, columnId: string) => {
    const min = facets?.[columnId]?.min
    const max = facets?.[columnId]?.max
    if (typeof min === 'number' && typeof max === 'number') return [min, max]
    if (typeof min === 'number') return [min, min]
    if (typeof max === 'number') return [max, max]
    return undefined
  }
}

/**
 * Returns a unified-logs row's timestamp in epoch milliseconds.
 *
 * The row mapper attaches a pre-parsed `date` (works for both BigQuery
 * microsecond timestamps and OTEL ISO strings); fall back to the raw
 * `timestamp` value when it's a number (older BQ-style microseconds).
 */
export function getRowTimestampMs(
  row: { date?: Date | null; timestamp?: number | string | null } | null | undefined
): number | null {
  if (row?.date instanceof Date) return row.date.getTime()
  if (typeof row?.timestamp === 'number') return row.timestamp / 1000
  return null
}

export const getLevelLabel = (value: (typeof LEVELS)[number]): string => {
  switch (value) {
    case 'success':
      return '2xx'
    case 'warning':
      return '4xx'
    case 'error':
      return '5xx'
  }
}

// Helper function to determine level from HTTP status code
export const getStatusLevel = (status?: number | string): string => {
  if (!status) return 'success'
  const statusNum = Number(status)
  if (statusNum >= 500) return 'error'
  if (statusNum >= 400) return 'warning'
  if (statusNum >= 300) return 'info' // 3xx redirects are informational
  if (statusNum >= 200) return 'success'
  if (statusNum >= 100) return 'info'
  return 'success'
}

export function getLevelRowClassName(value: (typeof LEVELS)[number]): string {
  switch (value) {
    case 'success':
      return ''
    case 'warning':
      return cn(
        'bg-warning/5 hover:bg-warning/10',
        'data-[state=selected]:bg-warning/20 focus-visible:bg-warning/10',
        'dark:bg-warning/10 dark:hover:bg-warning/20 dark:data-[state=selected]:bg-warning/30 dark:focus-visible:bg-warning/20'
      )
    case 'error':
      return cn(
        'bg-destructive/5 hover:bg-destructive/10',
        'data-[state=selected]:bg-destructive/20 focus-visible:bg-destructive/10',
        'dark:bg-error/10 dark:hover:bg-destructive/20 dark:data-[state=selected]:bg-destructive/30 dark:focus-visible:bg-destructive/20'
      )
    default:
      return ''
  }
}

/**
 * Formats service type strings for display purposes
 * Handles special cases like "edge function" -> "Edge Function"
 * and applies proper capitalization to other service types
 */
export function formatServiceTypeForDisplay(serviceType: string): string {
  if (!serviceType) return ''

  // Handle special cases
  const specialCases: Record<string, string> = {
    'edge function': 'Edge Function',
    postgrest: 'PostgREST',
    postgres: 'Postgres',
    auth: 'Auth',
    storage: 'Storage',
    realtime: 'Realtime',
    supavisor: 'Supavisor',
    pgbouncer: 'PgBouncer',
    multigres: 'Multigres',
  }

  return specialCases[serviceType.toLowerCase()] || serviceType
}

/**
 * Parses an auth log event_message that may be a stringified JSON object.
 * Auth log entries store metadata as JSON in event_message (e.g. {"msg":"...","level":"info"}).
 * Extracts the human-readable msg field, falling back to error, then the raw string.
 * The fallback ensures self-hosted versions with different formats still render correctly.
 */
export function parseAuthLogEventMessage(value: string | undefined): string | undefined {
  if (!value) return value

  try {
    const parsed = JSON.parse(value)

    if (parsed && typeof parsed === 'object') {
      const err = parsed.error || parsed.error_code
      if (typeof err === 'string' && err.trim()) {
        return !/^\d{3}:/.test(err) ? err.replaceAll('_', ' ') : err
      }

      const msg = parsed.msg
      if (typeof msg === 'string' && msg.trim()) {
        const action = parsed.action ?? parsed.auth_event?.action
        const authEvent = typeof action === 'string' ? action.replaceAll('_', ' ') : undefined
        return `${authEvent ? `${authEvent}: ` : ''}${msg}`
      }
    }

    return value
  } catch (error) {
    return value
  }
}

/**
 * Parses a Multigres log event_message, which is a stringified JSON object
 * (e.g. {"time":"...","level":"INFO","msg":"user pool capacity updated",...}).
 * Extracts the human-readable msg field, falling back to the raw string so
 * unexpected formats still render.
 */
export function parseMultigresEventMessage(value: string | undefined): string | undefined {
  if (!value) return value

  try {
    const parsed = JSON.parse(value)

    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.msg === 'string' &&
      parsed.msg.trim()
    ) {
      return parsed.msg
    }

    return value
  } catch (error) {
    return value
  }
}

/**
 * Returns the display text for a log row's event_message alongside whether it
 * should be rendered as a capitalized sentence. Keeps the per-service parsing
 * and its capitalization rule in one place so callers don't re-derive the list.
 */
export function getEventMessageDisplay(
  logType: string,
  value: string | undefined
): { message: string | undefined; capitalize: boolean } {
  if (logType === 'auth') return { message: parseAuthLogEventMessage(value), capitalize: true }
  if (logType === 'multigres')
    return { message: parseMultigresEventMessage(value), capitalize: true }
  return { message: value, capitalize: false }
}

/**
 * Multigres logs are gated behind the `showMultigresLogs` flag, so the multigres
 * log_type option is removed from the filter fields when the flag is disabled.
 */
export function gateMultigresLogType<T extends { value: string; options?: Option[] }>(
  fields: T[],
  showMultigresLogs: boolean
): T[] {
  if (showMultigresLogs) return fields

  return fields.map((field) =>
    field.value === 'log_type' && field.options
      ? ({ ...field, options: field.options.filter((option) => option.value !== 'multigres') } as T)
      : field
  )
}

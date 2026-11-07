import { formatDateTime } from '@/lib/datetime'

export const TABLE_EDITOR_TIMESTAMPTZ_FORMAT = 'YYYY-MM-DD HH:mm:ssZ'

export function isTimestamptzColumnFormat(format: string | undefined | null): boolean {
  if (!format) return false
  const normalized = format.toLowerCase()
  return normalized === 'timestamptz' || normalized === 'timestamp with time zone'
}

function normalizePostgresTimestamptz(value: string): string {
  let normalized = value.includes('T') ? value : value.replace(' ', 'T')
  // Postgres often emits +00 / +09 rather than +00:00
  normalized = normalized.replace(/([+-]\d{2})$/, '$1:00')
  // +0000 / -0700
  normalized = normalized.replace(/([+-])(\d{2})(\d{2})$/, '$1$2:$3')
  return normalized
}

/**
 * Format a timestamptz cell for Table Editor display in the given IANA timezone.
 * Returns null for SQL NULL, an empty string for empty values, and the original
 * value when the timestamp cannot be parsed so the grid still shows something.
 */
export function formatTimestamptzDisplay(value: unknown, timezone: string): string | null {
  if (value === null || value === undefined) return null
  if (value === '') return ''
  if (typeof value !== 'string' && typeof value !== 'number') return String(value)

  const input = typeof value === 'string' ? normalizePostgresTimestamptz(value) : value
  const formatted = formatDateTime(input, {
    tz: timezone,
    format: TABLE_EDITOR_TIMESTAMPTZ_FORMAT,
  })

  if (!formatted || formatted.includes('Invalid')) return String(value)
  return formatted
}

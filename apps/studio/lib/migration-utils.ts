import dayjs, { Dayjs } from 'dayjs'
import type { DatabaseMigration } from '@/data/database/migrations-query'

/**
 * Safely parses a migration version string as a date.
 * Migration versions are typically in the format YYYYMMDDHHmmss (e.g., "20231128095400").
 * However, some projects may have custom version formats (e.g., "001", "002") that cannot be parsed as dates.
 *
 * @param version - Migration version string
 * @returns Dayjs object (UTC mode) if the version is a valid datetime, undefined otherwise
 *
 * @example
 * const parsed = parseMigrationVersion('20231128095400')
 * if (parsed) {
 *   console.log(parsed.fromNow()) // "2 hours ago"
 *   console.log(parsed.format('DD MMM YYYY')) // "28 Nov 2023"
 * }
 *
 * @example
 * const invalid = parseMigrationVersion('001') // returns undefined
 */
export function parseMigrationVersion(version: string | null | undefined): Dayjs | undefined {
  if (!version) return undefined

  // Must contain only digits
  if (!/^\d{14}$/.test(version)) return undefined

  const parsed = dayjs.utc(version, 'YYYYMMDDHHmmss', true)
  return parsed.isValid() ? parsed : undefined
}

/**
 * Formats a migration version string as a human-readable UTC date label.
 * Returns 'Unknown' if the version cannot be parsed.
 */
export function formatMigrationVersionLabel(version: string | null | undefined): string {
  const parsed = parseMigrationVersion(version)
  return parsed ? parsed.format('DD MMM YYYY, HH:mm:ss') : 'Unknown'
}

/**
 * Returns a zero-padded sequential prefix for a migration file, e.g. "01", "02", "123".
 * Padding width is based on the total count of migrations being exported.
 */
function getSequentialPrefix(index: number, total: number): string {
  const width = String(total).length
  return String(index + 1).padStart(Math.max(width, 2), '0')
}

/**
 * Returns the filename for a migration export file, e.g. "01_create_users.sql".
 * Uses sequential prefix based on position within the exported set.
 */
export function getMigrationFilename(
  index: number,
  total: number,
  migration: DatabaseMigration
): string {
  const prefix = getSequentialPrefix(index, total)
  const safeName = migration.name
    ? `_${migration.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`
    : `_${migration.version}`
  return `${prefix}${safeName}.sql`
}

/**
 * Returns the SQL content for a single migration file, including a header comment.
 */
export function getMigrationSqlContent(migration: DatabaseMigration): string {
  const header = [
    `-- Migration: ${migration.version}${migration.name ? ` (${migration.name})` : ''}`,
    `-- Version: ${migration.version}`,
    '',
  ].join('\n')

  const body = migration.statements?.length
    ? migration.statements.join(';\n') + ';'
    : '-- (no statements)'

  return header + body + '\n'
}

/**
 * Triggers a browser download of a text file.
 */
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/**
 * Returns all migrations (already sorted ascending by version from DB) filtered by
 * an optional UTC date range. Migrations with unparseable versions are always included.
 */
export function filterMigrationsByDateRange(
  migrations: DatabaseMigration[],
  from: string | null,
  to: string | null
): DatabaseMigration[] {
  if (!from && !to) return migrations

  const fromDayjs = from ? dayjs(from).utc() : null
  const toDayjs = to ? dayjs(to).utc() : null

  return migrations.filter((m) => {
    const version = parseMigrationVersion(m.version)
    if (!version) return true // unparseable — always include
    if (fromDayjs && version.isBefore(fromDayjs)) return false
    if (toDayjs && version.isAfter(toDayjs)) return false
    return true
  })
}

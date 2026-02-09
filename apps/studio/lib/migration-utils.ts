import dayjs, { Dayjs } from 'dayjs'

/**
 * Safely parses a migration version string as a date.
 * Migration versions are typically in the format YYYYMMDDHHmmss (e.g., "20231128095400").
 * However, some projects may have custom version formats (e.g., "001", "002") that cannot be parsed as dates.
 *
 * @param version - Migration version string
 * @returns Dayjs object if the version is a valid datetime, null otherwise
 *
 * @example
 * const parsed = parseMigrationVersion('20231128095400')
 * if (parsed) {
 *   console.log(parsed.fromNow()) // "2 hours ago"
 *   console.log(parsed.format('DD MMM YYYY')) // "28 Nov 2023"
 * }
 *
 * @example
 * const invalid = parseMigrationVersion('001') // returns null
 */
export function parseMigrationVersion(version: string | null | undefined): Dayjs | undefined {
  if (!version) return undefined

  // Must contain only digits
  if (!/^\d{14}$/.test(version)) return undefined

  const parsed = dayjs(version, 'YYYYMMDDHHmmss', true)
  return parsed.isValid() ? parsed : undefined
}

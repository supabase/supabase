import dayjs from 'dayjs'

/**
 * Converts an ISO-8601 datetime to a Unix timestamp in seconds, as a string — the format
 * ConfigCat's date comparators expect for custom attributes (see
 * https://configcat.com/docs/targeting/targeting-rule/user-condition/#user-attribute-value-types).
 * Returns undefined for a missing or unparseable value so the caller can omit the custom
 * attribute entirely rather than send ConfigCat a bad one.
 */
export function toUnixSecondsString(isoDateTime: string | null | undefined): string | undefined {
  if (!isoDateTime) return undefined
  const parsed = dayjs(isoDateTime)
  if (!parsed.isValid()) return undefined
  return parsed.unix().toString()
}

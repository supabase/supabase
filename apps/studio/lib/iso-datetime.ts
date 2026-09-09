import dayjs from 'dayjs'

/**
 * An ISO-8601 datetime proven valid at construction via a dayjs parse. Callers that need to
 * carry a datetime through the type system without re-validating it (e.g. absolute log
 * ranges, notebook time ranges) use this instead of a raw string, so an unvalidated value
 * can never reach execution.
 */
export type IsoDateTimeString = string & { readonly __isoDateTimeBrand: unique symbol }

/**
 * Validate a raw string as an ISO datetime, returning the branded value or null. The sole
 * construction site for `IsoDateTimeString` besides a direct `toISOString()` call (which is
 * always valid ISO-8601 by construction).
 */
export function isoDateTimeString(raw: string): IsoDateTimeString | null {
  if (!raw) return null
  return dayjs(raw).isValid() ? (raw as IsoDateTimeString) : null
}

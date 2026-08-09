import dayjs from 'dayjs'

import type { Unit } from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'
import { generateDynamicHelper } from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'
import type { DatePickerValue } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import type { ResolvedLogDateRange } from '@/components/interfaces/Settings/Logs/logsDateRange'
import type { Snippet } from '@/data/content/sql-folders-query'
import { isoDateTimeString, type IsoDateTimeString } from '@/lib/iso-datetime'

/**
 * Domain view of where a snippet's query runs. Derived from the content TYPE:
 * a `log_sql` snippet always targets the logs backend and a `sql` (or `report`)
 * snippet always targets the user's Postgres database. A snippet's source is
 * immutable — switching backends means creating a new snippet, not toggling this
 * value.
 */
export type SqlSnippetSource = 'database' | 'logs'

/**
 * The single reader every surface (AI, reports, tabs, nav, execution) uses to
 * decide where a snippet runs. `'log_sql'` → `'logs'`; everything else (`'sql'`,
 * `'report'`) → `'database'`. Accepts the raw `Snippet['type']` so a snippet of
 * any content type maps to a source without narrowing first.
 */
export function getSnippetSource(snippet: Pick<Snippet, 'type'>): SqlSnippetSource {
  return snippet.type === 'log_sql' ? 'logs' : 'database'
}

export function isLogsSource(source: SqlSnippetSource | undefined): boolean {
  return source === 'logs'
}

/**
 * The markdown fence language a source's SQL is written into a prompt with, so the model
 * can tell a ClickHouse logs query from Postgres SQL.  */
export function sqlSourceToFenceLanguage(
  source: SqlSnippetSource | undefined
): 'sql' | 'clickhouse' {
  return isLogsSource(source) ? 'clickhouse' : 'sql'
}

/**
 * Parse a raw `source` value (e.g. the `?source=` query param a creation entry
 * threads through `/sql/new`) into a `SqlSnippetSource`. Only the explicit
 * `'logs'` opts a new snippet into the logs backend; anything else — including an
 * absent param — is a database snippet, keeping database the safe default.
 */
export function parseSqlSnippetSource(raw: string | undefined): SqlSnippetSource {
  return raw === 'logs' ? 'logs' : 'database'
}

/**
 * Resolve where an open snippet's query runs, falling back to the `?source=` URL param
 * when the snippet isn't in the store yet — a fresh `/sql/new` tab is materialized
 * lazily on the first keystroke, and until then the param is the only signal.
 */
export function resolveSnippetSource(
  snippet: Pick<Snippet, 'type'> | undefined,
  sourceParam: string | undefined
): SqlSnippetSource {
  return snippet !== undefined ? getSnippetSource(snippet) : parseSqlSnippetSource(sourceParam)
}

/** `now` as a branded ISO datetime — `toISOString()` is always valid ISO-8601. */
function nowIsoDateTime(): IsoDateTimeString {
  return dayjs().toISOString() as IsoDateTimeString
}

/**
 * The units a relative log range is expressed in. Aliases the Logs date picker's
 * `Unit` so the two stay in lockstep rather than drifting as parallel unions.
 */
export type RelativeTimeUnit = Unit

/**
 * A log query's time range. Relative ranges are structural (amount + unit) and
 * re-resolve against `now` at every run — so a saved "last hour" always means the
 * hour before the run, not the hour before the snippet was opened. Absolute ranges
 * carry validated ISO datetimes and pass through unchanged.
 */
export type LogDateRange =
  | { kind: 'relative'; last: { amount: number; unit: RelativeTimeUnit } }
  | { kind: 'absolute'; from: IsoDateTimeString; to: IsoDateTimeString }

/** The range a freshly opened logs snippet starts with: the last hour. */
export const DEFAULT_LOG_DATE_RANGE: LogDateRange = {
  kind: 'relative',
  last: { amount: 1, unit: 'hour' },
}

/**
 * The runtime query source for a snippet, pairing the database/logs discriminant
 * with the extra state each backend needs to run. A logs run carries the active
 * time range (session state, re-resolved at every run); a database run needs
 * nothing beyond the connection the execution pipeline already resolves.
 */
export type QuerySource = { type: 'database' } | { type: 'logs'; dateRange: LogDateRange }

/**
 * Parse a date-picker helper's label (e.g. "Last hour", "Last 3 hours", "Last 30
 * minutes") into a relative amount/unit. Covers both the static presets in
 * `EXPLORER_DATEPICKER_HELPERS` and the dynamic helpers `generateHelpersFromInput`
 * produces from typed input like "2h"/"30m". A label with no number means one unit
 * ("Last hour"). Returns null for any other label.
 */
function parseRelativeHelperLabel(
  text: string | undefined
): { amount: number; unit: RelativeTimeUnit } | null {
  if (!text) return null
  const match = text
    .trim()
    .toLowerCase()
    .match(/^last\s+(?:(\d+)\s+)?(minute|hour|day)s?$/)
  if (!match) return null
  const amount = match[1] ? parseInt(match[1], 10) : 1
  if (!Number.isFinite(amount) || amount <= 0) return null
  const unit = match[2]
  if (unit !== 'minute' && unit !== 'hour' && unit !== 'day') return null
  return { amount, unit }
}

/**
 * Convert a Logs date-picker value into a `LogDateRange`. Helper picks (presets and
 * dynamic "2h"/"30m" helpers) become relative ranges by parsing the helper label;
 * a preset's `calcTo()` resolves to `''` (meaning "now"), which the relative variant
 * models implicitly. Everything else — custom calendar picks, or a helper whose label
 * we can't parse — becomes an absolute range with validated ISO datetimes, degrading
 * via `from`/now rather than rejecting an empty string. A value with no usable `from`
 * falls back to the default range.
 */
export function datePickerValueToLogDateRange(value: DatePickerValue): LogDateRange {
  if (value.isHelper) {
    const relative = parseRelativeHelperLabel(value.text)
    if (relative) return { kind: 'relative', last: relative }
  }

  const from = isoDateTimeString(value.from)
  if (from === null) return DEFAULT_LOG_DATE_RANGE
  const to = isoDateTimeString(value.to) ?? nowIsoDateTime()
  return { kind: 'absolute', from, to }
}

/**
 * Render a `LogDateRange` back into a Logs date-picker value for display. Relative
 * ranges reuse the picker's own `generateDynamicHelper` to derive the resolved
 * `from`/`to` and matching "Last N unit(s)" label, so the value is byte-for-byte
 * what the picker itself would emit for that helper. Absolute ranges pass their
 * datetimes through.
 */
export function logDateRangeToDatePickerValue(range: LogDateRange): DatePickerValue {
  if (range.kind === 'relative') {
    const helper = generateDynamicHelper(range.last.amount, range.last.unit)
    return { from: helper.calcFrom(), to: helper.calcTo(), isHelper: true, text: helper.text }
  }
  return { from: range.from, to: range.to, isHelper: false }
}

/**
 * Structural equality for two log date ranges. Relative ranges match on amount +
 * unit, NOT display text — "Last hour" and "Last 1 hour" render differently but
 * are the same range, so comparing labels is unreliable. Absolute ranges match on
 * their (validated) ISO endpoints.
 */
export function logDateRangesEqual(a: LogDateRange, b: LogDateRange): boolean {
  if (a.kind === 'relative' && b.kind === 'relative') {
    return a.last.amount === b.last.amount && a.last.unit === b.last.unit
  }
  if (a.kind === 'absolute' && b.kind === 'absolute') {
    return a.from === b.from && a.to === b.to
  }
  return false
}

/**
 * Resolve a `LogDateRange` to concrete ISO endpoints for a run. Relative ranges
 * re-resolve against `now` (so "last hour" is always the hour before the run);
 * absolute ranges pass through. Reuses the Logs `ResolvedLogDateRange` shape.
 */
export function resolveLogRunRange(range: LogDateRange): ResolvedLogDateRange {
  if (range.kind === 'relative') {
    const now = dayjs()
    return {
      from: now.subtract(range.last.amount, range.last.unit).toISOString(),
      to: now.toISOString(),
    }
  }
  return { from: range.from, to: range.to }
}

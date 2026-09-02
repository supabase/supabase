import dayjs from 'dayjs'

import {
  generateDynamicHelper,
  type Unit,
} from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'
import type { DatePickerValue } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import type { ResolvedLogDateRange } from '@/components/interfaces/Settings/Logs/logsDateRange'
import { type TimeRange } from '@/data/content/notebooks/notebook-schema'
import { DEFAULT_LOG_TIME_RANGE } from '@/data/query-sources/query-source-registry'
import { isoDateTimeString, type IsoDateTimeString } from '@/lib/iso-datetime'

export type RelativeTimeUnit = Extract<TimeRange, { _tag: 'relative_time_range' }>['unit']

/**
 * The relative units the logs date picker can render as a helper preset. The wire schema
 * allows coarser units (week, month, year) that the picker has no preset for; a range
 * using one of those is shown as a resolved absolute range instead.
 */
const PICKER_TIME_UNITS: readonly Unit[] = ['minute', 'hour', 'day']

const isPickerUnit = (unit: RelativeTimeUnit): unit is Unit =>
  (PICKER_TIME_UNITS as readonly RelativeTimeUnit[]).includes(unit)

/** `toISOString()` is valid ISO-8601 by construction, so it needs no re-validation. */
const toIsoDateTime = (value: dayjs.Dayjs): IsoDateTimeString =>
  value.toISOString() as IsoDateTimeString

const nowIsoDateTime = (): IsoDateTimeString => toIsoDateTime(dayjs())

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

export function datePickerValueToLogTimeRange(value: DatePickerValue): TimeRange {
  if (value.isHelper) {
    const relative = parseRelativeHelperLabel(value.text)
    if (relative) {
      return { _tag: 'relative_time_range', amount: relative.amount, unit: relative.unit }
    }
  }

  const start = isoDateTimeString(value.from)
  if (start === null) return DEFAULT_LOG_TIME_RANGE
  const end = isoDateTimeString(value.to) ?? nowIsoDateTime()
  return { _tag: 'absolute_time_range', start, end }
}

export function logTimeRangeToDatePickerValue(range: TimeRange): DatePickerValue {
  if (range._tag === 'relative_time_range' && isPickerUnit(range.unit)) {
    const helper = generateDynamicHelper(range.amount, range.unit)
    return {
      from: helper.calcFrom(),
      to: helper.calcTo(),
      isHelper: true,
      text: helper.text,
    }
  }

  const resolved = resolveLogTimeRange(range)
  return { from: resolved.from, to: resolved.to, isHelper: false }
}

export function customDateRangeToLogTimeRange({
  from,
  to,
  now = new Date(),
}: {
  from: Date
  to: Date
  now?: Date
}): Extract<TimeRange, { _tag: 'absolute_time_range' }> {
  const nowValue = dayjs(now)
  const requestedEnd = dayjs(to).endOf('day')

  return {
    _tag: 'absolute_time_range',
    start: toIsoDateTime(dayjs(from).startOf('day')),
    end: toIsoDateTime(requestedEnd.isAfter(nowValue) ? nowValue : requestedEnd),
  }
}

export function logTimeRangesEqual(a: TimeRange, b: TimeRange): boolean {
  if (a._tag === 'relative_time_range' && b._tag === 'relative_time_range') {
    return a.amount === b.amount && a.unit === b.unit
  }
  if (a._tag === 'absolute_time_range' && b._tag === 'absolute_time_range') {
    return a.start === b.start && a.end === b.end
  }
  return false
}

export function resolveLogTimeRange(range: TimeRange): ResolvedLogDateRange {
  if (range._tag === 'relative_time_range') {
    const now = dayjs()
    return {
      from: now.subtract(range.amount, range.unit).toISOString(),
      to: now.toISOString(),
    }
  }
  return { from: range.start, to: range.end }
}

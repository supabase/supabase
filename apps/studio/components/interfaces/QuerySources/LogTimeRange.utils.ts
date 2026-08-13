import dayjs from 'dayjs'

import { generateDynamicHelper } from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'
import type { DatePickerValue } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import type { ResolvedLogDateRange } from '@/components/interfaces/Settings/Logs/logsDateRange'
import {
  DEFAULT_LOG_TIME_RANGE,
  type LogTimeRange,
} from '@/data/query-sources/query-source-registry'
import { isoDateTimeString, type IsoDateTimeString } from '@/lib/iso-datetime'

export type RelativeTimeUnit = Extract<LogTimeRange, { type: 'relative' }>['unit']

const nowIsoDateTime = (): IsoDateTimeString => dayjs().toISOString() as IsoDateTimeString

function parseRelativeHelperLabel(
  text: string | undefined
): { amount: number; unit: RelativeTimeUnit } | null {
  if (!text) return null
  const match = text
    .trim()
    .toLowerCase()
    .match(/^last\s+(?:(\d+)\s+)?(minute|hour|day|week)s?$/)
  if (!match) return null

  const amount = match[1] ? parseInt(match[1], 10) : 1
  if (!Number.isFinite(amount) || amount <= 0) return null

  const unit = match[2]
  if (unit !== 'minute' && unit !== 'hour' && unit !== 'day' && unit !== 'week') return null
  return { amount, unit }
}

export function datePickerValueToLogTimeRange(value: DatePickerValue): LogTimeRange {
  if (value.isHelper) {
    const relative = parseRelativeHelperLabel(value.text)
    if (relative) return { type: 'relative', ...relative }
  }

  const from = isoDateTimeString(value.from)
  if (from === null) return DEFAULT_LOG_TIME_RANGE
  const to = isoDateTimeString(value.to) ?? nowIsoDateTime()
  return { type: 'absolute', from, to }
}

export function logTimeRangeToDatePickerValue(range: LogTimeRange): DatePickerValue {
  if (range.type === 'relative') {
    const helper = generateDynamicHelper(range.amount, range.unit)
    return {
      from: helper.calcFrom(),
      to: helper.calcTo(),
      isHelper: true,
      text: helper.text,
    }
  }
  return { from: range.from, to: range.to, isHelper: false }
}

export function customDateRangeToLogTimeRange({
  from,
  to,
  now = new Date(),
}: {
  from: Date
  to: Date
  now?: Date
}): Extract<LogTimeRange, { type: 'absolute' }> {
  const nowValue = dayjs(now)
  const requestedTo = dayjs(to).endOf('day')

  return {
    type: 'absolute',
    from: dayjs(from).startOf('day').toISOString(),
    to: requestedTo.isAfter(nowValue) ? nowValue.toISOString() : requestedTo.toISOString(),
  }
}

export function logTimeRangesEqual(a: LogTimeRange, b: LogTimeRange): boolean {
  if (a.type === 'relative' && b.type === 'relative') {
    return a.amount === b.amount && a.unit === b.unit
  }
  if (a.type === 'absolute' && b.type === 'absolute') {
    return a.from === b.from && a.to === b.to
  }
  return false
}

export function resolveLogTimeRange(range: LogTimeRange): ResolvedLogDateRange {
  if (range.type === 'relative') {
    const now = dayjs()
    return {
      from: now.subtract(range.amount, range.unit).toISOString(),
      to: now.toISOString(),
    }
  }
  return { from: range.from, to: range.to }
}

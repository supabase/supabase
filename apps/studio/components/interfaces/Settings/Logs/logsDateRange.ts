import dayjs from 'dayjs'

import { EXPLORER_DATEPICKER_HELPERS, getDefaultHelper } from './Logs.constants'
import type { DatePickerValue } from './Logs.DatePickers'
import type { DatetimeHelper } from './Logs.types'

export interface ResolvedLogDateRange {
  from: string
  to: string
}

export interface ResolvedLogParams extends ResolvedLogDateRange {
  sql: string
}

const findHelper = (value: DatePickerValue, helpers: DatetimeHelper[]) => {
  if (!value.text) return undefined
  return helpers.find((helper) => helper.text === value.text)
}

const ensureEnd = (candidate: string | undefined, now: dayjs.Dayjs) => {
  if (candidate && candidate.length > 0) return candidate
  return now.toISOString()
}

export const resolveLogDateRange = (
  value: DatePickerValue,
  helpers: DatetimeHelper[] = EXPLORER_DATEPICKER_HELPERS
): ResolvedLogDateRange => {
  const now = dayjs()
  if (value.isHelper) {
    const matchedHelper = findHelper(value, helpers) ?? getDefaultHelper(helpers)
    const from = matchedHelper?.calcFrom() ?? value.from ?? ''
    const to = ensureEnd(matchedHelper?.calcTo() ?? value.to, now)
    return { from, to }
  }

  const defaultHelper = getDefaultHelper(helpers)
  const from = value.from || defaultHelper.calcFrom()
  const to = ensureEnd(value.to, now)
  return { from, to }
}

export const buildLogQueryParams = (
  value: DatePickerValue,
  sql: string,
  helpers: DatetimeHelper[] = EXPLORER_DATEPICKER_HELPERS
): ResolvedLogParams => {
  const range = resolveLogDateRange(value, helpers)
  return {
    sql,
    from: range.from,
    to: range.to,
  }
}

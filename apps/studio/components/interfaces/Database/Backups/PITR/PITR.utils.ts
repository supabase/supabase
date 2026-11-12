import dayjs from 'dayjs'

import type { Time } from './PITR.types'
import type { ProjectSelectedAddon } from '@/data/subscriptions/types'
import { findTimezoneByIana, TIMEZONES_BY_IANA } from '@/lib/constants/timezones'
import { guessLocalTimezone } from '@/lib/dayjs'

export const getPITRRetentionDuration = (addons: ProjectSelectedAddon[]) => {
  const pitrAddon = addons.find((addon) => addon.type === 'pitr')
  if (!pitrAddon) return 0

  return (pitrAddon.variant.meta as any)?.backup_duration_days ?? 0
}

export const getDatesBetweenRange = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
  const diff = endDate.diff(startDate, 'day')

  return Array.from({ length: diff }, (_, index) => startDate.add(index, 'day'))
}

export const getClientTimezone = () => {
  const utcTimezone = TIMEZONES_BY_IANA.find((option) => option.value === 'UTC')
  return findTimezoneByIana(guessLocalTimezone()) ?? utcTimezone ?? TIMEZONES_BY_IANA[0]
}

export const formatNumberToTwoDigits = (number: Number) => {
  return number.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  })
}

// Formats Time object to hh:mm:ss
export const formatTimeToTimeString = (time: Time) => {
  return `${formatNumberToTwoDigits(time.h)}:${formatNumberToTwoDigits(
    time.m
  )}:${formatNumberToTwoDigits(time.s)}`
}

export function constrainDateToRange(current: dayjs.Dayjs, lower: dayjs.Dayjs, upper: dayjs.Dayjs) {
  if (current.isBefore(lower)) {
    return lower
  }
  if (current.isAfter(upper)) {
    return upper
  }
  return current
}

export function getRestoreDate(unix: number, timezone: string) {
  const instant = dayjs.unix(unix).utc()
  const offset = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(instant.toDate())
    .find((part) => part.type === 'timeZoneName')?.value
  const match = offset?.match(/^GMT([+-])(\d{2}):(\d{2})$/)
  if (!match) return instant

  const minutes = Number(match[2]) * 60 + Number(match[3])
  return instant.utcOffset(match[1] === '-' ? -minutes : minutes)
}

export function updateRestoreDate(
  current: dayjs.Dayjs,
  date: string,
  time: Time,
  timezone: string
) {
  const wallTime = dayjs.utc(date).hour(time.h).minute(time.m).second(time.s)
  const candidate = getRestoreDate(
    wallTime.subtract(current.utcOffset(), 'minute').unix(),
    timezone
  )
  const format = 'YYYY-MM-DD HH:mm:ss'
  if (candidate.format(format) === wallTime.format(format)) return candidate

  return getRestoreDate(dayjs.tz(wallTime.format(format), timezone).unix(), timezone)
}

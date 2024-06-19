import dayjs from 'dayjs'
import { ALL_TIMEZONES } from './PITR.constants'
import type { Time } from './PITR.types'
import type { ProjectSelectedAddon } from 'data/subscriptions/types'

export const getPITRRetentionDuration = (addons: ProjectSelectedAddon[]) => {
  const pitrAddon = addons.find((addon) => addon.type === 'pitr')
  if (!pitrAddon) return 0

  return pitrAddon.variant.meta?.backup_duration_days ?? 0
}

export const getDatesBetweenRange = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
  const diff = endDate.diff(startDate, 'day')

  return Array.from({ length: diff }, (_, index) => startDate.add(index, 'day'))
}

export const getClientTimezone = () => {
  const defaultTz = dayjs.tz.guess()
  const utcTz = ALL_TIMEZONES.find((option) => option.value === 'UTC')
  const timezone = ALL_TIMEZONES.find((option) => {
    if (option.utc.includes(defaultTz)) return option
    else return undefined
  })
  return timezone ?? (utcTz || ALL_TIMEZONES[0])
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

import dayjs from 'dayjs'

import type { Time } from './PITR.types'
import type { ProjectSelectedAddon } from '@/data/subscriptions/types'

export const getPITRRetentionDuration = (addons: ProjectSelectedAddon[]) => {
  const pitrAddon = addons.find((addon) => addon.type === 'pitr')
  if (!pitrAddon) return 0

  return (pitrAddon.variant.meta as any)?.backup_duration_days ?? 0
}

export const getDatesBetweenRange = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
  const diff = endDate.diff(startDate, 'day')

  return Array.from({ length: diff }, (_, index) => startDate.add(index, 'day'))
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

// The calendar works in browser-local Date objects, so a date shown in another
// timezone has to be handed over as the same year/month/day at local midnight.
export const toCalendarDate = (date: dayjs.Dayjs) =>
  new Date(date.year(), date.month(), date.date())

export const withCalendarDate = (
  current: dayjs.Dayjs,
  calendarDate: Date,
  timezone: string
): dayjs.Dayjs =>
  dayjs.tz(`${dayjs(calendarDate).format('YYYY-MM-DD')} ${current.format('HH:mm:ss')}`, timezone)

export const withTime = (current: dayjs.Dayjs, { h, m, s }: Time): dayjs.Dayjs =>
  current.set('hour', h).set('minute', m).set('second', s)

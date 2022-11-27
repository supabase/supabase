import { StripeProduct } from 'components/interfaces/Billing'
import dayjs from 'dayjs'
import { ALL_TIMEZONES } from './PITR.constants'
import { Time, Timezone } from './PITR.types'

export const getPITRRetentionDuration = (addons: StripeProduct[]) => {
  const pitrAddon = addons.find((addon) => addon.supabase_prod_id.startsWith('addon_pitr'))
  if (!pitrAddon) return 0

  const daysString = pitrAddon.supabase_prod_id.split('_')[2]
  return Number(daysString.split('days')[0])
}

export const getDatesBetweenRange = (start: Date, end: Date) => {
  const arr = []
  for (let i, dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt))
  }
  return arr
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

export const checkMatchingDates = (selectedDate: Date | undefined, targetDate: Date) => {
  if (!selectedDate) return false

  const formattedSelectedDate = new Date(selectedDate.getTime())
  formattedSelectedDate.setHours(0, 0, 0, 0)

  const formattedTargetDate = new Date(targetDate.getTime())
  formattedTargetDate.setHours(0, 0, 0, 0)

  return Number(formattedSelectedDate) === Number(formattedTargetDate)
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

export const getTimezoneOffsetText = (timezone: Timezone) => {
  return timezone.text.split(')')[0].slice(1)
}

export const getTimezoneOffset = (timezone: Timezone) => {
  return timezone.text.split(')')[0].slice(4)
}

export const convertDatetimetoUnixS = (date: Date, time: Time, timezone: Timezone) => {
  const dateString = dayjs(date).format('YYYY-MM-DD')
  const timeString = formatTimeToTimeString(time)
  const timezoneOffset = getTimezoneOffset(timezone)
  const datetimestringWithTimezone = `${dateString}T${timeString}${timezoneOffset || '+00:00'}`
  return dayjs(datetimestringWithTimezone).unix()
}

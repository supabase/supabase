import dayjs from 'dayjs'
import { ALL_TIMEZONES } from './PITRBackupSelection.constants'
import { Timezone } from './PITRBackupSelection.types'

export const getClientTimezone = () => {
  const defaultTz = dayjs.tz.guess()
  const timezone = ALL_TIMEZONES.find((option) => {
    if (option.utc.includes(defaultTz)) return option
    else return undefined
  })
  return timezone
}

export const getTimezoneOffsetText = (timezone: Timezone) => {
  return timezone.text.split(')')[0].slice(1)
}

export const getTimezoneOffset = (timezone: Timezone) => {
  return timezone.text.split(')')[0].slice(4)
}

import dayjs from 'dayjs'
import { ALL_TIMEZONES } from './PITR.constants'
import { Timezone } from './PITR.types'

export const getClientTimezone = () => {
  const defaultTz = dayjs.tz.guess()
  const timezone = ALL_TIMEZONES.find((option) => {
    if (option.utc.includes(defaultTz)) return option
    else return undefined
  })
  return timezone ?? ALL_TIMEZONES[0]
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

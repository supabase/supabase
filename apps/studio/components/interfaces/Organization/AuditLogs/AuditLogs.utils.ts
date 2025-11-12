import { DatePickerToFrom } from 'components/interfaces/Settings/Logs/Logs.types'
import dayjs from 'dayjs'

// [Joshen] Mainly to handle if a single date is selected - currently just for Audit Logs as
// i'm on the fence if this logic should be within the DatePicker component itself
// e.g for Logs.DatePicker which uses this component, the component itself has its own time selection UI
// JFYI currentDate is just a parameter so that I can run tests for this

export const formatSelectedDateRange = (value: DatePickerToFrom) => {
  const current = dayjs()
  const from = dayjs(value.from)
    .hour(current.hour())
    .minute(current.minute())
    .second(current.second())
  const to = dayjs(value.to).hour(current.hour()).minute(current.minute()).second(current.second())

  if (from.date() === to.date()) {
    // [Joshen] If a single date is selected, we either set the "from" to start from 00:00
    // or "to" to end at 23:59 depending on which date was selected
    if (from.date() === current.date()) {
      return {
        from: from.set('hour', 0).set('minute', 0).set('second', 0).utc().toISOString(),
        to: to.utc().toISOString(),
      }
    } else {
      return {
        from: from.utc().toISOString(),
        to: to.set('hour', 23).set('minute', 59).set('second', 59).utc().toISOString(),
      }
    }
  } else {
    return { from: from.utc().toISOString(), to: to.utc().toISOString() }
  }
}

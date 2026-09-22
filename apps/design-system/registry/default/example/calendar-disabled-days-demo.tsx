'use client'

import * as React from 'react'
import { Calendar } from 'ui'

// The dates are specifically chosen to show a month which starts mid week.
const latestDate = new Date(2026, 6, 10)
const earliestDate = new Date(2026, 6, 7)

export default function CalendarMidWeekDemo() {
  const [date, setDate] = React.useState<Date | undefined>(earliestDate)

  return (
    <Calendar
      mode="single"
      required={true}
      selected={date}
      onSelect={setDate}
      defaultMonth={latestDate}
      startMonth={earliestDate}
      endMonth={latestDate}
      disabled={[{ before: earliestDate }, { after: latestDate }]}
    />
  )
}

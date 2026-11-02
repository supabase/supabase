'use client'

import { format } from 'date-fns'
import * as React from 'react'
import { Calendar } from 'ui'
import {
  DatePicker,
  DatePickerButton,
  DatePickerContent,
  DatePickerTrigger,
} from 'ui-patterns/DatePicker'

export default function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>()

  return (
    <DatePicker>
      <DatePickerTrigger asChild>
        <DatePickerButton variant="outline" className="w-[280px]">
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </DatePickerButton>
      </DatePickerTrigger>
      <DatePickerContent>
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </DatePickerContent>
    </DatePicker>
  )
}

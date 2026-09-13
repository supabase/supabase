'use client'

import { addDays, format } from 'date-fns'
import * as React from 'react'
import { Calendar, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import {
  DatePicker,
  DatePickerButton,
  DatePickerContent,
  DatePickerTrigger,
} from 'ui-patterns/DatePicker'

export default function DatePickerWithPresets() {
  const [date, setDate] = React.useState<Date>()

  return (
    <DatePicker>
      <DatePickerTrigger asChild>
        <DatePickerButton variant="outline" className="w-[280px]">
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </DatePickerButton>
      </DatePickerTrigger>
      <DatePickerContent className="flex w-auto flex-col space-y-2 p-2">
        <Select onValueChange={(value) => setDate(addDays(new Date(), parseInt(value)))}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="0">Today</SelectItem>
            <SelectItem value="1">Tomorrow</SelectItem>
            <SelectItem value="3">In 3 days</SelectItem>
            <SelectItem value="7">In a week</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded-md border">
          <Calendar mode="single" selected={date} onSelect={setDate} />
        </div>
      </DatePickerContent>
    </DatePicker>
  )
}

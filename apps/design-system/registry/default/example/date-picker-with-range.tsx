'use client'

import { addDays, format } from 'date-fns'
import * as React from 'react'
import { DateRange } from 'react-day-picker'
import { Calendar } from 'ui'
import {
  DatePicker,
  DatePickerButton,
  DatePickerContent,
  DatePickerTrigger,
} from 'ui-patterns/DatePicker'

import { cn } from '@/lib/utils'

export default function DatePickerWithRange({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  })

  return (
    <div className={cn('grid gap-2', className)}>
      <DatePicker>
        <DatePickerTrigger asChild>
          <DatePickerButton variant="outline" className="w-[300px]">
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </DatePickerButton>
        </DatePickerTrigger>
        <DatePickerContent>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </DatePickerContent>
      </DatePicker>
    </div>
  )
}

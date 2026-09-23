import dayjs from 'dayjs'
import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { Calendar } from 'ui'
import {
  DatePicker,
  DatePickerButton,
  DatePickerContent,
  DatePickerTrigger,
} from 'ui-patterns/DatePicker'

interface CreditBurndownDateRangePickerProps {
  from: Date
  to: Date
  minDate: Date
  onChange: (range: { from: Date; to: Date }) => void
}

export const CreditBurndownDateRangePicker = ({
  from,
  to,
  minDate,
  onChange,
}: CreditBurndownDateRangePickerProps) => {
  const [open, setOpen] = useState(false)
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>({ from, to })

  const maxDate = dayjs().startOf('day').toDate()

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) setPendingRange({ from, to })
  }

  const handleSelect = (range: DateRange | undefined) => {
    setPendingRange(range)
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to })
      setOpen(false)
    }
  }

  return (
    <DatePicker open={open} onOpenChange={handleOpenChange}>
      <DatePickerTrigger asChild>
        <DatePickerButton variant="outline" size="tiny" className="py-1.5">
          {dayjs(from).format('MMM D, YYYY')} - {dayjs(to).format('MMM D, YYYY')}
        </DatePickerButton>
      </DatePickerTrigger>
      <DatePickerContent align="end">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={to}
          selected={pendingRange}
          onSelect={handleSelect}
          disabled={{ before: minDate, after: maxDate }}
          numberOfMonths={2}
        />
      </DatePickerContent>
    </DatePicker>
  )
}

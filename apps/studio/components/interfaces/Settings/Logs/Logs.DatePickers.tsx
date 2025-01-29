import DatePicker from 'react-datepicker'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { format } from 'date-fns'

import {
  Button,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Popover,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import { LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD, getDefaultHelper } from './Logs.constants'
import type { DatePickerToFrom, DatetimeHelper } from './Logs.types'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import TimeSplitInput from 'components/ui/DatePicker/TimeSplitInput'
import { cn } from 'ui'
import { RadioGroup, RadioGroupItem } from '@ui/components/shadcn/ui/radio-group'
import { Label } from '@ui/components/shadcn/ui/label'

export type DatePickerValue = {
  to: string
  from: string
  isHelper?: boolean
  text?: string
}

interface Props {
  to: string
  from: string
  value: DatePickerValue
  onSubmit: (args: DatePickerValue) => void
  helpers: DatetimeHelper[]
}

type Time = { HH: string; mm: string; ss: string }

export const LogsDatePicker: React.FC<Props> = ({ to, from, onSubmit, helpers, value }) => {
  const defaultHelper = getDefaultHelper(helpers)
  const [helperValue, setHelperValue] = useState<string>(to || from ? '' : defaultHelper.text)

  const handleHelperChange = (newValue: string) => {
    const selectedHelper = helpers.find((h) => h.text === newValue)
    if (onSubmit && selectedHelper) {
      onSubmit({
        to: selectedHelper.calcTo(),
        from: selectedHelper.calcFrom(),
        isHelper: true,
        text: selectedHelper.text,
      })
    }
  }

  const selectedHelper = helpers.find((helper) => {
    if (to === helper.calcTo() && from === helper.calcFrom()) {
      return true
    }
    return false
  })

  useEffect(() => {
    if (selectedHelper && helperValue !== selectedHelper.text) {
      setHelperValue(selectedHelper.text)
    } else if (!selectedHelper && (to || from)) {
      setHelperValue('')
    }
  }, [selectedHelper, to, from])

  const [open, setOpen] = useState(true)

  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const [startTime, setStartTime] = useState({
    HH: startDate?.getHours().toString() || '0',
    mm: startDate?.getMinutes().toString() || '0',
    ss: startDate?.getSeconds().toString() || '0',
  })
  const [endTime, setEndTime] = useState({
    HH: endDate?.getHours().toString() || '0',
    mm: endDate?.getMinutes().toString() || '0',
    ss: endDate?.getSeconds().toString() || '0',
  })

  function handleDatePickerChange(dates: [from: Date | null, to: Date | null]) {
    const [from, to] = dates

    setStartDate(from)
    setEndDate(to)
  }

  function handleApply() {
    const from = startDate || new Date()
    const to = endDate || new Date()

    // Add Time to the dates
    const finalFrom = new Date(from.setHours(+startTime.HH, +startTime.mm, +startTime.ss))
    const finalTo = new Date(to.setHours(+endTime.HH, +endTime.mm, +endTime.ss))

    console.log('finalFrom', finalFrom.toISOString())
    console.log('finalTo', finalTo.toISOString())

    onSubmit({
      from: finalFrom.toISOString(),
      to: finalTo.toISOString(),
      isHelper: false,
    })
    setOpen(false)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="default" icon={<Clock size={12} />}>
          {value.isHelper
            ? value.text
            : `${dayjs(value.from).format('MMM D, HH:mm')} - ${dayjs(value.to).format('MMM D, HH:mm')}`}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ side="bottom" align="center" className="flex w-full p-0">
        <RadioGroup
          onValueChange={handleHelperChange}
          value={selectedHelper?.text || ''}
          className="border-r p-2 flex flex-col gap-px"
        >
          {helpers.map((helper) => (
            <Label
              key={helper.text}
              className="[&:has([data-state=checked])]:bg-background-overlay-hover [&:has([data-state=checked])]:text-foreground px-4 py-2 text-foreground-light flex items-center gap-2 hover:bg-background-overlay-hover hover:text-foreground transition-all rounded-sm"
            >
              <RadioGroupItem
                hidden
                key={helper.text}
                value={helper.text}
                disabled={helper.disabled}
              ></RadioGroupItem>
              {helper.text}
            </Label>
          ))}
        </RadioGroup>

        <div>
          <div className="flex *:flex-grow p-2 gap-2">
            <TimeSplitInput
              type="start"
              startTime={startTime}
              endTime={endTime}
              time={startTime}
              setTime={setStartTime}
              setStartTime={setStartTime}
              setEndTime={setEndTime}
              startDate={startDate}
              endDate={endDate}
            />
            <TimeSplitInput
              type="end"
              startTime={startTime}
              endTime={endTime}
              time={endTime}
              setTime={setEndTime}
              setStartTime={setStartTime}
              setEndTime={setEndTime}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
          <div className="p-2 border-t [&_.react-datepicker__day--today]:bg-red-500">
            <DatePicker
              inline
              selectsRange
              onChange={(dates) => {
                handleDatePickerChange(dates)
              }}
              dateFormat="MMMM d, yyyy h:mm aa"
              dayClassName={() => 'cursor-pointer'}
              selected={startDate}
              startDate={startDate}
              endDate={endDate}
              renderCustomHeader={({
                date,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => (
                <div className="flex items-center justify-between">
                  <div className="flex w-full items-center justify-between">
                    <button
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                      type="button"
                      className={`
                        ${prevMonthButtonDisabled && 'cursor-not-allowed opacity-50'}
                        text-foreground-light hover:text-foreground focus:outline-none p-2
                    `}
                    >
                      <ChevronLeft size={16} strokeWidth={2} />
                    </button>
                    <span className="text-sm text-foreground-light">
                      {format(date, 'MMMM yyyy')}
                    </span>
                    <button
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                      type="button"
                      className={`
                        ${nextMonthButtonDisabled && 'cursor-not-allowed opacity-50'}
                        text-foreground-light p-2 hover:text-foreground focus:outline-none
                    `}
                    >
                      <ChevronRight size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
          <div className="flex items-center justify-end gap-2 p-2 border-t">
            <Button
              type="default"
              onClick={() => {
                setStartDate(new Date())
                setEndDate(new Date())
              }}
            >
              Clear
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

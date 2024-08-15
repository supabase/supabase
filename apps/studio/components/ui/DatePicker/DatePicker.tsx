import { format } from 'date-fns'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'

import type { DatePickerToFrom } from 'components/interfaces/Settings/Logs/Logs.types'
import {
  Button,
  IconArrowRight,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  Popover,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'
import { ButtonProps } from 'ui/src/components/Button/Button'
import TimeSplitInput from './TimeSplitInput'

export interface DatePickerProps {
  onChange?: (args: DatePickerToFrom) => void
  to?: string // ISO string
  from?: string // ISO string
  triggerButtonType?: ButtonProps['type']
  triggerButtonClassName?: string
  triggerButtonTitle?: string
  minDate?: Date
  maxDate?: Date
  hideTime?: boolean
  hideClear?: boolean
  selectsRange?: boolean
  renderFooter?: (args: DatePickerToFrom) => React.ReactNode | void
  children?: React.ReactNode | React.ReactNode[] | null
}

const START_DATE_DEFAULT = new Date()
const END_DATE_DEFAULT = new Date()

const START_TIME_DEFAULT = { HH: '00', mm: '00', ss: '00' }
const END_TIME_DEFAULT = { HH: '23', mm: '59', ss: '59' }

function _DatePicker({
  to,
  from,
  onChange,
  triggerButtonType = 'default',
  triggerButtonClassName = '',
  triggerButtonTitle,
  minDate,
  maxDate,
  hideTime = false,
  hideClear = false,
  selectsRange = true,
  renderFooter = () => null,
  children,
}: DatePickerProps) {
  const [open, setOpen] = useState<boolean>(false)
  const [appliedStartDate, setAppliedStartDate] = useState<null | Date>(null)
  const [appliedEndDate, setAppliedEndDate] = useState<null | Date>(null)
  const [startDate, setStartDate] = useState<Date | null>(START_DATE_DEFAULT)
  const [endDate, setEndDate] = useState<Date | null>(END_DATE_DEFAULT)
  const [startTime, setStartTime] = useState<any>(START_TIME_DEFAULT)
  const [endTime, setEndTime] = useState<any>(END_TIME_DEFAULT)

  useEffect(() => {
    if (!from) {
      setAppliedStartDate(null)
    } else if (from !== appliedStartDate?.toISOString()) {
      const start = dayjs(from)
      const startDate = start.toDate()
      setAppliedStartDate(startDate)
      setStartDate(startDate)
      setStartTime({
        HH: start.format('HH'),
        mm: start.format('mm'),
        ss: start.format('ss'),
      })
    }

    if (!to) {
      setAppliedEndDate(null)
    } else if (to !== appliedEndDate?.toISOString()) {
      const end = dayjs(to)
      const endDate = end.toDate()
      setAppliedEndDate(endDate)
      setEndDate(endDate)
      setEndTime({
        HH: end.format('HH'),
        mm: end.format('mm'),
        ss: end.format('ss'),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, from])

  function handleDatePickerChange(dates: Date | [from: Date | null, to: Date | null] | null) {
    if (!dates) {
      setStartDate(null)
      setEndDate(null)
    } else if (dates instanceof Date) {
      setStartDate(dates)
      setEndDate(dates)
    } else {
      const [from, to] = dates
      setStartDate(from)
      setEndDate(to)
    }
  }

  function handleSubmit() {
    setOpen(false)

    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)

    const payload = {
      from: dayjs(startDate)
        .second(Number(startTime.ss))
        .minute(Number(startTime.mm))
        .hour(Number(startTime.HH))
        .toISOString(),
      to: dayjs(endDate || startDate)
        .second(Number(endTime.ss))
        .minute(Number(endTime.mm))
        .hour(Number(endTime.HH))
        .toISOString(),
    }
    if (onChange) onChange(payload)
  }

  function handleClear() {
    setOpen(false)
    setStartDate(START_DATE_DEFAULT)
    setEndDate(END_DATE_DEFAULT)

    setStartTime(START_TIME_DEFAULT)
    setEndTime(END_TIME_DEFAULT)

    setAppliedStartDate(null)
    setAppliedEndDate(null)

    if (onChange) onChange({ from: null, to: null })
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button
          title={triggerButtonTitle}
          type={triggerButtonType}
          icon={<IconCalendar />}
          className={triggerButtonClassName}
        >
          {children !== undefined ? (
            children
          ) : (
            <>
              {/* Custom */}
              {selectsRange &&
              appliedStartDate &&
              appliedEndDate &&
              appliedStartDate !== appliedEndDate ? (
                <>
                  {format(new Date(appliedStartDate), 'dd MMM')} -{' '}
                  {format(new Date(appliedEndDate), 'dd MMM')}
                </>
              ) : appliedStartDate || appliedEndDate ? (
                format(new Date((appliedStartDate || appliedEndDate)!), 'dd MMM')
              ) : (
                'Custom'
              )}
            </>
          )}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ align="center" side="bottom" className="p-0">
        <>
          {hideTime ? null : (
            <>
              <div className="flex items-stretch justify-between py-2">
                {!selectsRange ? null : (
                  <>
                    <div className="flex grow flex-col gap-1 pl-2">
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
                    </div>
                    <div
                      className={`
                      flex 
                      w-12 
                      items-center 
                      justify-center
                      text-foreground-lighter
                    `}
                    >
                      <IconArrowRight strokeWidth={1.5} size={14} />
                    </div>
                  </>
                )}
                <div className="flex grow flex-col gap-1 pr-2">
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
              </div>
            </>
          )}
          <div className="p-2">
            <DatePicker
              inline
              selectsRange={selectsRange}
              selected={startDate}
              onChange={(dates) => {
                handleDatePickerChange(dates)
              }}
              dateFormat="MMMM d, yyyy h:mm aa"
              startDate={startDate}
              endDate={endDate}
              minDate={minDate}
              maxDate={maxDate}
              dayClassName={() => 'cursor-pointer'}
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
                      <IconChevronLeft size={16} strokeWidth={2} />
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
                      <IconChevronRight size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
          {renderFooter({
            from: startDate?.toISOString() || null,
            to: endDate?.toISOString() || null,
          })}
          <Popover.Separator />
          <div className="flex items-center justify-end gap-2 py-2 px-3 pb-4">
            {!hideClear && (
              <Button type="default" onClick={() => handleClear()}>
                Clear
              </Button>
            )}
            <Button onClick={() => handleSubmit()}>Apply</Button>
          </div>
        </>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

export default _DatePicker

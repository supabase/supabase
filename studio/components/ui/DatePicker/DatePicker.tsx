import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import {
  Button,
  Popover,
  IconChevronLeft,
  IconChevronRight,
  IconArrowRight,
  IconCalendar,
} from 'ui'

import { format } from 'date-fns'
import TimeSplitInput from './TimeSplitInput'
import dayjs from 'dayjs'
import { ButtonProps } from 'ui/src/components/Button/Button'
import { DatePickerToFrom } from 'components/interfaces/Settings/Logs'

export interface DatePickerProps {
  onChange?: (args: DatePickerToFrom) => void
  to?: string
  from?: string
  triggerButtonType?: ButtonProps['type']
  triggerButtonClassName?: string
  triggerButtonTitle?: string
  renderFooter?: (args: DatePickerToFrom) => React.ReactNode | void
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
  renderFooter = () => null,
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
      const start = dayjs(from).toDate()
      setAppliedStartDate(start)
      setStartDate(start)
    }

    if (!to) {
      setAppliedEndDate(null)
    } else if (to !== appliedEndDate?.toISOString()) {
      const end = dayjs(to).toDate()
      setAppliedEndDate(end)
      setEndDate(end)
    }
  }, [to, from])

  function handleDatePickerChange(dates: [from: Date | null, to: Date | null]) {
    const [from, to] = dates
    setStartDate(from)
    setEndDate(to)
  }

  function handleSubmit() {
    setOpen(false)

    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)

    const payload = {
      from: dayjs
        .utc(startDate)
        .second(startTime.ss)
        .minute(startTime.mm)
        .hour(startTime.HH)
        .toISOString(),
      to: dayjs
        .utc(endDate || startDate)
        .second(endTime.ss)
        .minute(endTime.mm)
        .hour(endTime.HH)
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
  }
  return (
    <Popover
      open={open}
      onOpenChange={(e) => setOpen(e)}
      size="small"
      align="center"
      side="bottom"
      header={
        <>
          <div className="flex items-stretch justify-between py-2">
            <div className="flex grow flex-col gap-1">
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
                      text-scale-900
                    `}
            >
              <IconArrowRight strokeWidth={1.5} size={14} />
            </div>
            <div className="flex grow flex-col gap-1">
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
      }
      overlay={
        <>
          <div className="px-3 py-4">
            <DatePicker
              selected={startDate}
              onChange={(dates) => {
                handleDatePickerChange(dates)
              }}
              dateFormat="MMMM d, yyyy h:mm aa"
              startDate={startDate}
              endDate={endDate}
              selectsRange
              inline
              dayClassName={() => 'cursor-pointer'}
              renderCustomHeader={({
                date,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => (
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex w-full items-center justify-between">
                    <button
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                      type="button"
                      className={`
                        ${prevMonthButtonDisabled && 'cursor-not-allowed opacity-50'}
                        text-scale-1100 hover:text-scale-1200 focus:outline-none
                    `}
                    >
                      <IconChevronLeft size={16} strokeWidth={2} />
                    </button>
                    <span className="text-sm text-scale-1100">{format(date, 'MMMM yyyy')}</span>
                    <button
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                      type="button"
                      className={`
                        ${nextMonthButtonDisabled && 'cursor-not-allowed opacity-50'}
                        text-scale-1100 hover:text-scale-1200 focus:outline-none
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
            <Button type="default" onClick={() => handleClear()}>
              Clear
            </Button>
            <Button onClick={() => handleSubmit()}>Apply</Button>
          </div>
        </>
      }
    >
      <Button
        title={triggerButtonTitle}
        type={triggerButtonType}
        as="span"
        icon={<IconCalendar />}
        className={triggerButtonClassName}
      >
        {/* Custom */}
        {appliedStartDate && appliedEndDate && appliedStartDate !== appliedEndDate ? (
          <>
            {format(new Date(appliedStartDate), 'dd MMM')} -{' '}
            {format(new Date(appliedEndDate), 'dd MMM')}
          </>
        ) : appliedStartDate || appliedEndDate ? (
          format(new Date((appliedStartDate || appliedEndDate)!), 'dd MMM')
        ) : (
          'Custom'
        )}
      </Button>
    </Popover>
  )
}

export default _DatePicker

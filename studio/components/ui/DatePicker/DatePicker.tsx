import React, { useState, forwardRef, useEffect } from 'react'

import DatePicker from 'react-datepicker'

// import dayjs from 'dayjs'

import {
  Button,
  Popover,
  IconChevronLeft,
  IconChevronRight,
  IconArrowRight,
  IconCalendar,
  IconGlobe,
  Input,
  Toggle,
  Select,
} from '@supabase/ui'

import { format } from 'date-fns'

import TimeSplitInput from './TimeSplitInput'
// import DateSplitInput from './DateSplitInput'
import DividerSlash from './DividerSlash'

import dayjs from 'dayjs'
import { ButtonProps } from '@supabase/ui/dist/cjs/components/Button/Button'

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin

dayjs.extend(utc)
dayjs.extend(timezone)

interface RootProps {
  onChange?: ({ to, from }: { to: string; from: string }) => void
  to?: string
  from?: string
  triggerButtonType?: ButtonProps['type']
  triggerButtonClassName?: string
}

const START_DATE_DEFAULT = new Date()
const END_DATE_DEFAULT = new Date()

// console.log('START_DATE_DEFAULT', START_DATE_DEFAULT)

const START_TIME_DEFAULT = { HH: '00', mm: '00', ss: '00' }
const END_TIME_DEFAULT = { HH: '23', mm: '59', ss: '59' }

function _DatePicker({
  to,
  from,
  onChange,
  triggerButtonType = 'default',
  triggerButtonClassName = '',
}: RootProps) {
  const [open, setOpen] = useState<boolean>(false)

  const [showTime, setShowTime] = useState<boolean>(true)

  const [appliedStartDate, setAppliedStartDate] = useState<any>(null)
  const [appliedEndDate, setAppliedEndDate] = useState<any>(null)

  const [startDate, setStartDate] = useState<any>(START_DATE_DEFAULT)
  const [endDate, setEndDate] = useState<any>(END_DATE_DEFAULT)

  const [startTime, setStartTime] = useState<any>(START_TIME_DEFAULT)
  const [endTime, setEndTime] = useState<any>(END_TIME_DEFAULT)

  useEffect(() => {
    if (!to || !from) {
      setAppliedStartDate(null)
      setAppliedEndDate(null)
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

  const DEFAULT_DATE_FORMAT = 'ddd MMM YYYY HH:mm:ss'

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(e) => setOpen(e)}
        size="small"
        align="center"
        side="bottom"
        header={
          <>
            <div className="flex justify-between items-stretch py-2">
              <div className="grow flex flex-col gap-1">
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
                      w-12 
                      flex 
                      items-center 
                      justify-center
                      text-scale-900
                    `}
              >
                <IconArrowRight strokeWidth={1.5} size={14} />
              </div>
              <div className="grow flex flex-col gap-1">
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
                // showTimeSelect
                // nextMonthButtonLabel=">"
                // previousMonthButtonLabel="<"
                // popperClassName="react-datepicker-left"
                // customInput={<ButtonInput />}
                // dateFormat={DEFAULT_DATE_FORMAT}
                // dateFormat={(locale, date) => dayjs(date).format('MM-YYYY')}
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
                    <div className="flex items-center justify-between w-full">
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

            <Popover.Seperator />
            <div className="flex items-center justify-end gap-2 py-2 pb-4 px-3">
              <Button type="default" onClick={() => handleClear()}>
                Clear
              </Button>
              <Button onClick={() => handleSubmit()}>Apply</Button>
            </div>
          </>
        }
      >
        <Button
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
            format(new Date(appliedStartDate || appliedEndDate), 'dd MMM')
          ) : (
            'Custom'
          )}
        </Button>
      </Popover>

      {/* <div className="relative w-40">
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            nextMonthButtonLabel=">"
            previousMonthButtonLabel="<"
            popperClassName="react-datepicker-right"
            customInput={<ButtonInput />}
            renderCustomHeader={({
              date,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => (
              <>
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center justify-between w-full">
                    <button
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                      type="button"
                      className={`
                        ${
                          prevMonthButtonDisabled &&
                          'cursor-not-allowed opacity-50'
                        }
                        text-scale-1100 hover:text-scale-1200 focus:outline-none
                    `}
                    >
                      <IconChevronLeft size={16} strokeWidth={2} />
                    </button>
                    <span className="text-sm text-scale-1100">
                      {format(date, 'MMMM yyyy')}
                    </span>
                    <button
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                      type="button"
                      className={`
                        ${
                          nextMonthButtonDisabled &&
                          'cursor-not-allowed opacity-50'
                        }
                        text-scale-1100 hover:text-scale-1200 focus:outline-none
                    `}
                    >
                      <IconChevronRight size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </>
            )}
          />
        </div>
      </div>
      <div className="flex items-center justify-center max-w-2xl py-20 mx-auto space-x-4">
        <span className="font-medium text-gray-900">Default Components:</span>
        <div className="relative w-40">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            nextMonthButtonLabel=">"
            previousMonthButtonLabel="<"
            popperClassName="react-datepicker-left"
          />
        </div>
        <div className="relative w-40">
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            nextMonthButtonLabel=">"
            previousMonthButtonLabel="<"
            popperClassName="react-datepicker-right"
          />
        </div> */}
    </>
  )
}

const ButtonInput = forwardRef(({ value, onClick }: any, ref): any => (
  <button
    onClick={onClick}
    // @ts-ignore
    ref={ref}
    type="button"
    className="inline-flex justify-start w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500"
  >
    {value}
  </button>
))

export default _DatePicker

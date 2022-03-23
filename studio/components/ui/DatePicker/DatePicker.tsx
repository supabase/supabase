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
import DateSplitInput from './DateSplitInput'
import DividerSlash from './DividerSlash'

import dayjs from 'dayjs'

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin

dayjs.extend(utc)
dayjs.extend(timezone)

interface RootProps {
  onChange?: ({}) => void
  initialValues?: {
    to: number
    from: number
  }
  to?: number
  from?: number
}

const START_DATE_DEFAULT = new Date()
const END_DATE_DEFAULT = new Date()

// console.log('START_DATE_DEFAULT', START_DATE_DEFAULT)

const TIME_NOW = format(new Date(), 'HH:mm:ss').split(':')

const START_TIME_DEFAULT = { HH: TIME_NOW[0], mm: TIME_NOW[1], ss: TIME_NOW[2] }
const END_TIME_DEFAULT = { HH: TIME_NOW[0], mm: TIME_NOW[1], ss: TIME_NOW[2] }

function _DatePicker({ to, from, onChange, initialValues }: RootProps) {
  const [open, setOpen] = useState<boolean>(false)

  const [showTime, setShowTime] = useState<boolean>(true)

  const [appliedStartDate, setAppliedStartDate] = useState<any>(null)
  const [appliedEndDate, setAppliedEndDate] = useState<any>(null)

  const [startDate, setStartDate] = useState<any>(START_DATE_DEFAULT)
  const [endDate, setEndDate] = useState<any>(END_DATE_DEFAULT)

  const [startTime, setStartTime] = useState<any>(START_TIME_DEFAULT)
  const [endTime, setEndTime] = useState<any>(END_TIME_DEFAULT)

  if (initialValues) {
    const from = dayjs(initialValues.from)
    const to = dayjs(initialValues.to)
  }

  function handleDatePickerChange(dates: [from: string, to: string]) {
    const [from, to] = dates

    console.log('start', from)
    console.log('end', to)
    setStartDate(from)
    setEndDate(to)
  }

  function handleSubmit() {
    setOpen(false)

    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)

    const from = `${format(new Date(startDate), 'yyyy-MM-dd')} ${Object.values(startTime).join(
      ':'
    )}`
    const to = `${format(new Date(endDate), 'yyyy-MM-dd')} ${Object.values(endTime).join(':')}`

    function isoPayload() {
      return {
        from: dayjs(from).toISOString(),
        to: dayjs(to).toISOString(),
      }
    }

    function unixPayload() {
      return {
        from: dayjs(from).valueOf(),
        to: dayjs(to).valueOf(),
      }
    }

    // console.log('unixPayload', unixPayload())
    // console.log('isoPayload', isoPayload())

    if (onChange) onChange(isoPayload())
  }

  function handleClear() {
    setOpen(false)
    setStartDate(START_DATE_DEFAULT)
    setEndDate(END_DATE_DEFAULT)

    setStartTime(START_DATE_DEFAULT)
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
                {/* <div
                  className="
                      flex items-center justify-center gap-0
                      text-xs text-scale-1100 bg-scale-100 dark:bg-scaleA-300 border border-scale-700 h-7 rounded"
                >
                  <input
                    pattern="[0-9]*"
                    placeholder="DD"
                    // type="text"
                    aria-describedby="DateInput-input-1696-description"
                    aria-label="Day"
                    className="w-4 bg-transparent text-scale-1200 text-center"
                    value={format(new Date(startDate), 'dd')}
                  />
                  <DividerSlash />
                  <input
                    pattern="[0-9]*"
                    placeholder="MM"
                    // type="text"
                    aria-describedby="DateInput-input-1853-description"
                    aria-label="Month"
                    className="w-4 bg-transparent text-scale-1200 text-center"
                    value={format(new Date(startDate), 'MM')}
                  />
                  <DividerSlash />
                  <input
                    pattern="[0-9]*"
                    placeholder="YYYY"
                    // type="text"
                    aria-describedby="DateInput-input-1860-description"
                    aria-label="Year"
                    className="w-8 bg-transparent text-scale-1200 text-center"
                    value={format(new Date(startDate), 'yyyy')}
                  />
                </div> */}

                {/* <DateSplitInput
                  type="start"
                  date={startDate}
                  setDate={(e) => setStartDate(e)}
                  startDate={startDate}
                  endDate={endDate}
                /> */}

                {showTime && (
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
                )}
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
                {/* <div
                  className="
                      flex items-center justify-center gap-0
                      text-xs text-scale-1100 bg-scale-100 dark:bg-scaleA-300 border border-scale-700 h-7 rounded"
                >
                  <input
                    className="appearance-none w-4 text-scale-1200 bg-transparent text-center"
                    value={format(new Date(endDate), 'dd')}
                  />
                  <DividerSlash />
                  <input
                    className="appearance-none w-4 text-scale-1200 bg-transparent text-center"
                    value={format(new Date(endDate), 'MM')}
                  />
                  <DividerSlash />
                  <input
                    className="appearance-none w-8 text-scale-1200 bg-transparent text-center"
                    value={format(new Date(endDate), 'yyyy')}
                  />
                </div> */}
                {/* <DateSplitInput
                  type="end"
                  date={endDate}
                  setDate={(e) => setEndDate(e)}
                  startDate={startDate}
                  endDate={endDate}
                /> */}
                {showTime && (
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
                )}
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
                renderCustomHeader={({
                  date,
                  decreaseMonth,
                  increaseMonth,
                  prevMonthButtonDisabled,
                  nextMonthButtonDisabled,
                }) => [
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
                  </div>,
                ]}
              />
              <div className="flex items-center gap-2  pt-4">
                <Toggle
                  size="tiny"
                  // @ts-ignore
                  onChange={(bool: boolean) => setShowTime(bool)}
                />
                <span className="text-xs text-scale-1100">Show times</span>
              </div>
              {/* <div className="flex items-center gap-2 text-scale-900 pt-4 mb-4">
                  <IconGlobe size={14} />
                  <div className="grow">
                    <Select size="tiny">
                      <Select.Option value="GMT">London GMT +0</Select.Option>
                    </Select>
                  </div>
                </div> */}
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
        <Button type="default" icon={<IconCalendar />}>
          {/* Custom */}
          {appliedStartDate && appliedEndDate ? (
            <>
              {format(new Date(appliedStartDate), 'dd MMM')} -{' '}
              {format(new Date(appliedEndDate), 'dd MMM')}
            </>
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

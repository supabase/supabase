import React, { useState } from 'react'
import { IconClock } from '@supabase/ui'
import DividerSlash from './DividerSlash'

import { format } from 'date-fns'
import { DateType } from './DatePicker.types'
import dayjs from 'dayjs'

var advancedFormat = require('dayjs/plugin/advancedFormat')
var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone') // dependent on utc plugin

dayjs.extend(advancedFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.guess()

// type TimeType = 'DD' | 'MM' | 'YYYY'

// type Time = {
//   HH: string
//   mm: string
//   ss: string
// }

interface TimeSplitInputProps {
  date: string
  // setTime: (x: Time) => void
  type: 'start' | 'end'
  // setStartTime: (x: Time) => void
  // setEndTime: (x: Time) => void
  // startTime: Time
  // endTime: Time
  startDate: any
  endDate: any
  setDate: ({}) => void
}

const DateSplitInput = ({
  type,
  date,
  // setTime,
  // setStartTime,
  // setEndTime,
  // startTime,
  // endTime,
  startDate,
  endDate,
  setDate,
}: TimeSplitInputProps) => {
  const [focus, setFocus] = useState(false)

  const [splitDate, setSplitDate] = useState({
    DD: format(new Date(date), 'dd'),
    MM: format(new Date(date), 'MM'),
    YYYY: format(new Date(date), 'yyyy'),
  })

  function handleOnChange() {
    // console.log('handleOnChange')

    const payload = {
      DD: splitDate.DD,
      MM: splitDate.MM,
      YYYY: splitDate.YYYY,
    }

    // if (Number(payload.YYYY) > 2021) {
    //   payload.YYYY = 2021
    // }
    // if (value.length > 2) return

    // switch (valueType) {
    //   case 'DD':
    //     if (value && Number(value) > 23) return
    //     break
    //   case 'MM':
    //     if (value && Number(value) > 59) return
    //     break
    //   case 'YYYY':
    //     if (value && Number(value) > 59) return
    //     break
    //   default:
    //     break
    // }

    // console.log('got here')

    // payload[valueType] = value

    const dns_format = new Date(Number(payload.YYYY), Number(payload.MM), Number(payload.DD))

    // console.log('format:', dns_format)

    setDate(dns_format)
  }

  function sanitize(valueType: DateType) {
    // console.log('handle blur')
    const _time = splitDate
    // console.log('_time.MM.length', _time.MM.length)

    if (_time.DD.length === 1) _time.DD = '0' + _time.DD
    if (_time.MM.length === 1) _time.MM = '0' + _time.MM
    if (_time.YYYY.length === 1) _time.YYYY = '0' + _time.YYYY

    if (!_time.DD) _time.DD = '00'
    if (!_time.MM) _time.MM = '00'
    if (!_time.YYYY) _time.YYYY = '00'

    // console.log('_time', _time)

    let endTimeChanges = false
    let endTimePayload = endTime

    let startTimeChanges = false
    let startTimePayload = startTime

    // Only run time conflicts if
    // startDate and endDate are the same date

    // console.log(startDate)
    // console.log(endDate)
    if (format(new Date(startDate), 'dd/mm/yyyy') == format(new Date(endDate), 'dd/mm/yyyy')) {
      // checks if start time is ahead of end time

      if (type === 'start') {
        // console.log('HH in start switch')
        if (_time.MM && Number(_time.MM) > Number(endTime.HH)) {
          endTimePayload.HH = _time.MM
          endTimeChanges = true
        }

        if (
          // also check the hour
          _time.MM &&
          Number(_time.MM) >= Number(endTime.HH) &&
          // check the minutes
          _time.MM &&
          Number(_time.MM) > Number(endTime.mm)
        ) {
          endTimePayload.mm = _time.MM
          endTimeChanges = true
        }

        if (
          // also check the hour
          _time.MM &&
          Number(_time.MM) >= Number(endTime.HH) &&
          // check the minutes
          _time.MM &&
          Number(_time.MM) >= Number(endTime.mm) &&
          // check the seconds
          _time.YYYY &&
          Number(_time.YYYY) > Number(endTime.ss)
        ) {
          endTimePayload.ss = _time.YYYY
          endTimeChanges = true
        }
      }

      if (type === 'end') {
        // console.log('HH in start switch')

        if (_time.MM && Number(_time.MM) < Number(startTime.HH)) {
          startTimePayload.HH = _time.MM
          startTimeChanges = true
        }

        if (
          // also check the hour
          _time.MM &&
          Number(_time.MM) <= Number(startTime.HH) &&
          // check the minutes
          _time.MM &&
          Number(_time.MM) < Number(startTime.mm)
        ) {
          startTimePayload.mm = _time.MM
          startTimeChanges = true
        }

        if (
          // also check the hour
          _time.MM &&
          Number(_time.MM) <= Number(startTime.HH) &&
          // check the minutes
          _time.MM &&
          Number(_time.MM) <= Number(startTime.mm) &&
          // check the seconds
          _time.YYYY &&
          Number(_time.YYYY) < Number(startTime.ss)
        ) {
          startTimePayload.ss = _time.YYYY
          startTimeChanges = true
        }
      }
    }

    setTime({ ..._time })

    if (endTimeChanges) {
      setEndTime({ ...endTimePayload })
    }
    if (startTimeChanges) {
      setStartTime({ ...startTimePayload })
    }

    setFocus(false)
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select()
    setFocus(true)
  }

  return (
    <div
      className={`
        flex items-center justify-center gap-0
        text-xs text-scale-1100 bg-scale-100 dark:bg-scaleA-300 border border-scale-700 h-7 rounded
        ${focus && ' outline outline-2 outline-scale-500 border-scale-800'}
    `}
    >
      <input
        onBlur={() => handleOnChange()}
        onFocus={handleFocus}
        pattern="[0-31]*"
        placeholder="00"
        maxLength={2}
        onChange={(e) => setSplitDate({ ...splitDate, DD: e.target.value })}
        aria-label="Days"
        className="text-scale-1200 w-5 bg-transparent text-center outline-none"
        value={splitDate.DD}
      />
      <DividerSlash />
      <input
        onBlur={() => handleOnChange()}
        onFocus={handleFocus}
        pattern="[0-12]*"
        placeholder="00"
        maxLength={2}
        onChange={(e) => setSplitDate({ ...splitDate, MM: e.target.value })}
        aria-label="Months"
        className="text-scale-1200 w-5 bg-transparent text-center outline-none"
        value={splitDate.MM}
      />
      <DividerSlash />
      <input
        onBlur={() => handleOnChange()}
        onFocus={handleFocus}
        pattern="[2021-2022]*"
        placeholder="00"
        maxLength={4}
        minLength={4}
        onChange={(e) => setSplitDate({ ...splitDate, YYYY: e.target.value })}
        aria-label="Years"
        className="text-scale-1200 w-8 bg-transparent text-center outline-none"
        value={splitDate.YYYY}
      />
    </div>
  )
}

export default DateSplitInput

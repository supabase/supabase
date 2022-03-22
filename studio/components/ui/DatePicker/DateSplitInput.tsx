import React, { useState } from 'react'
import { IconClock } from '@supabase/ui'

import { format } from 'date-fns'

type TimeType = 'DD' | 'MM' | 'YYYY'

type Time = {
  HH: string
  mm: string
  ss: string
}

interface TimeSplitInputProps {
  time: Time
  setTime: (x: Time) => void
  type: 'start' | 'end'
  setStartTime: (x: Time) => void
  setEndTime: (x: Time) => void
  startTime: Time
  endTime: Time
  startDate: any
  endDate: any
}

const TimeSplitInput = ({
  type,
  time,
  setTime,
  setStartTime,
  setEndTime,
  startTime,
  endTime,
  startDate,
  endDate,
}: TimeSplitInputProps) => {
  const [focus, setFocus] = useState(false)

  function handleOnChange(value: string, valueType: TimeType) {
    // console.log('handleOnChange')

    const payload = {
      HH: time.HH,
      mm: time.mm,
      ss: time.ss,
    }
    if (value.length > 2) return

    switch (valueType) {
      case 'DD':
        if (value && Number(value) > 23) return
        break
      case 'MM':
        if (value && Number(value) > 59) return
        break
      case 'YYYY':
        if (value && Number(value) > 59) return
        break
      default:
        break
    }

    // console.log('got here')

    payload[valueType] = value
    setTime({ ...payload })

    // if (endTimeChanges) {
    //   setEndTime(endTimePayload)
    // }
  }

  function handleOnBlur(valueType: TimeType) {
    // console.log('handle blur')
    const _time = time
    // console.log('_time.HH.length', _time.HH.length)

    if (_time.HH.length === 1) _time.HH = '0' + _time.HH
    if (_time.mm.length === 1) _time.mm = '0' + _time.mm
    if (_time.ss.length === 1) _time.ss = '0' + _time.ss

    if (!_time.HH) _time.HH = '00'
    if (!_time.mm) _time.mm = '00'
    if (!_time.ss) _time.ss = '00'

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
        if (_time.HH && Number(_time.HH) > Number(endTime.HH)) {
          endTimePayload.HH = _time.HH
          endTimeChanges = true
        }

        if (
          // also check the hour
          _time.HH &&
          Number(_time.HH) >= Number(endTime.HH) &&
          // check the minutes
          _time.mm &&
          Number(_time.mm) > Number(endTime.mm)
        ) {
          endTimePayload.mm = _time.mm
          endTimeChanges = true
        }

        if (
          // also check the hour
          _time.HH &&
          Number(_time.HH) >= Number(endTime.HH) &&
          // check the minutes
          _time.mm &&
          Number(_time.mm) >= Number(endTime.mm) &&
          // check the seconds
          _time.ss &&
          Number(_time.ss) > Number(endTime.ss)
        ) {
          endTimePayload.ss = _time.ss
          endTimeChanges = true
        }
      }

      if (type === 'end') {
        // console.log('HH in start switch')

        if (_time.HH && Number(_time.HH) < Number(startTime.HH)) {
          startTimePayload.HH = _time.HH
          startTimeChanges = true
        }

        if (
          // also check the hour
          _time.HH &&
          Number(_time.HH) <= Number(startTime.HH) &&
          // check the minutes
          _time.mm &&
          Number(_time.mm) < Number(startTime.mm)
        ) {
          startTimePayload.mm = _time.mm
          startTimeChanges = true
        }

        if (
          // also check the hour
          _time.HH &&
          Number(_time.HH) <= Number(startTime.HH) &&
          // check the minutes
          _time.mm &&
          Number(_time.mm) <= Number(startTime.mm) &&
          // check the seconds
          _time.ss &&
          Number(_time.ss) < Number(startTime.ss)
        ) {
          startTimePayload.ss = _time.ss
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
      <div className="text-scale-900 mr-1">
        <IconClock size={14} strokeWidth={1.5} />
      </div>
      <input
        onBlur={() => handleOnBlur('DD')}
        onFocus={handleFocus}
        pattern="[0-31]*"
        placeholder="00"
        onChange={(e) => handleOnChange(e.target.value, 'DD')}
        aria-label="Days"
        className="text-scale-1200 w-5 bg-transparent text-center outline-none"
        value={time.HH}
      />
      <span className="text-scale-900">:</span>
      <input
        onBlur={() => handleOnBlur('MM')}
        onFocus={handleFocus}
        pattern="[0-12]*"
        placeholder="00"
        onChange={(e) => handleOnChange(e.target.value, 'MM')}
        aria-label="Months"
        className="text-scale-1200 w-5 bg-transparent text-center outline-none"
        value={time.mm}
      />
      <span className="text-scale-900">:</span>
      <input
        onBlur={() => handleOnBlur('YYYY')}
        onFocus={handleFocus}
        pattern="[2021-2022]*"
        placeholder="00"
        onChange={(e) => handleOnChange(e.target.value, 'YYYY')}
        aria-label="Years"
        className="text-scale-1200 w-5 bg-transparent text-center outline-none"
        value={time.ss}
      />
    </div>
  )
}

export default TimeSplitInput

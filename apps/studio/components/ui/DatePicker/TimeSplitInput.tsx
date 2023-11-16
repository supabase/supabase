import React, { useEffect, useState } from 'react'
import { IconClock } from 'ui'

import { format } from 'date-fns'

import { TimeSplitInputProps, TimeType } from './DatePicker.types'

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

  function handleOnBlur() {
    const _time = time

    if (_time.HH.length === 1) _time.HH = '0' + _time.HH
    if (_time.mm.length === 1) _time.mm = '0' + _time.mm
    if (_time.ss.length === 1) _time.ss = '0' + _time.ss

    if (!_time.HH) _time.HH = '00'
    if (!_time.mm) _time.mm = '00'
    if (!_time.ss) _time.ss = '00'

    let endTimeChanges = false
    let endTimePayload = endTime

    let startTimeChanges = false
    let startTimePayload = startTime

    // Only run time conflicts if
    // startDate and endDate are the same date

    if (format(new Date(startDate), 'dd/mm/yyyy') == format(new Date(endDate), 'dd/mm/yyyy')) {
      // checks if start time is ahead of end time

      if (type === 'start') {
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

  function handleOnChange(value: string, valueType: TimeType) {
    const payload = {
      HH: time.HH,
      mm: time.mm,
      ss: time.ss,
    }
    if (value.length > 2) return

    switch (valueType) {
      case 'HH':
        if (value && Number(value) > 23) return
        break
      case 'mm':
        if (value && Number(value) > 59) return
        break
      case 'ss':
        if (value && Number(value) > 59) return
        break
      default:
        break
    }

    payload[valueType] = value
    setTime({ ...payload })
  }

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select()
    setFocus(true)
  }

  useEffect(() => {
    handleOnBlur()
  }, [startDate, endDate])

  return (
    <div
      className={`
        flex h-7 items-center justify-center
        gap-0 rounded border border-strong bg-surface-100 text-xs text-foreground-light
        ${focus && ' border-stronger outline outline-2 outline-border'}
    `}
    >
      <div className="mr-1 text-foreground-lighter">
        <IconClock size={14} strokeWidth={1.5} />
      </div>

      <input
        type="text"
        onBlur={() => handleOnBlur()}
        onFocus={handleFocus}
        pattern="[0-23]*"
        placeholder="00"
        onChange={(e) => handleOnChange(e.target.value, 'HH')}
        aria-label="Hours"
        className="
            ring-none
            w-4
            border-none
            bg-transparent
            p-0 text-center text-xs
            text-foreground
            outline-none
            ring-0
            focus:ring-0
        "
        value={time.HH}
      />
      <span className="text-foreground-lighter">:</span>
      <input
        type="text"
        onBlur={() => handleOnBlur()}
        onFocus={handleFocus}
        pattern="[0-12]*"
        placeholder="00"
        onChange={(e) => handleOnChange(e.target.value, 'mm')}
        aria-label="Minutes"
        className="
            ring-none
            w-4
            border-none
            bg-transparent
            p-0 text-center text-xs
            text-foreground
            outline-none
            ring-0
            focus:ring-0
        "
        value={time.mm}
      />
      <span className="text-foreground-lighter">:</span>
      <input
        type="text"
        onBlur={() => handleOnBlur()}
        onFocus={handleFocus}
        pattern="[0-59]*"
        placeholder="00"
        onChange={(e) => handleOnChange(e.target.value, 'ss')}
        aria-label="Seconds"
        className="
            ring-none
            w-4
            border-none
            bg-transparent
            p-0 text-center text-xs
            text-foreground
            outline-none
            ring-0
            focus:ring-0
        "
        value={time.ss}
      />
    </div>
  )
}

export default TimeSplitInput

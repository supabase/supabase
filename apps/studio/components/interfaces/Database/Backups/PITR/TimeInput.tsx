import dayjs from 'dayjs'
import { isNaN, noop } from 'lodash'
import { Clock } from 'lucide-react'
import { ChangeEvent, useCallback, useEffect, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import type { Time } from './PITR.types'
import { formatNumberToTwoDigits, formatTimeToTimeString } from './PITR.utils'

// [Joshen] This is trying to do the same thing as TimeSplitInput.tsx
// so can we please look to try to combine these 2 components together if possible
// The problem with TimeSplitInput is that it's tightly coupled to the date + its
// tightly coupled to the context of a range. Ideally it should be more modular
// which is what this component is trying to achieve

// [Joshen] Potential extension, give option to toggle 24 hours or AM/PM

interface TimeInputProps {
  defaultTime?: Time
  resetIdentity?: string
  rangeError?: string
  onChange?: (time: Time) => void
  onValidityChange?: (isValid: boolean) => void
}

const TimeInput = ({
  defaultTime,
  resetIdentity,
  rangeError,
  onChange = noop,
  onValidityChange = noop,
}: TimeInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [error, setError] = useState<string>()
  const [time, setTime] = useState<Time>(defaultTime || { h: 0, m: 0, s: 0 })
  const visibleError = error ?? rangeError
  const defaultHour = defaultTime?.h
  const defaultMinute = defaultTime?.m
  const defaultSecond = defaultTime?.s
  let borderClassName = 'border-strong'
  if (isFocused) borderClassName = 'border-stronger'
  else if (visibleError !== undefined) borderClassName = 'border-red-800'

  const validate = useCallback(
    (time: Time) => {
      const formattedTime = dayjs(formatTimeToTimeString(time), 'HH:mm:ss', true)
      const nextError = formattedTime.isValid() ? undefined : 'Please enter a valid time'

      setError(nextError)
      onValidityChange(nextError === undefined)
      return nextError === undefined
    },
    [onValidityChange]
  )

  useEffect(() => {
    if (defaultHour !== undefined && defaultMinute !== undefined && defaultSecond !== undefined) {
      const nextTime = { h: defaultHour, m: defaultMinute, s: defaultSecond }
      setTime(nextTime)
      validate(nextTime)
    }
  }, [defaultHour, defaultMinute, defaultSecond, resetIdentity, validate])

  const onFocus = () => setIsFocused(true)

  const onInputChange = (event: ChangeEvent<HTMLInputElement>, unit: 'h' | 'm' | 's') => {
    if (isNaN(Number(event.target.value))) return
    setTime({ ...time, [unit]: event.target.value })
  }

  const onInputBlur = (event: ChangeEvent<HTMLInputElement>, unit: 'h' | 'm' | 's') => {
    const formattedInput = Number(event.target.value)
    const updatedTime = { ...time, [unit]: formattedInput }
    setTime(updatedTime)

    if (validate(updatedTime)) onChange(updatedTime)
    setIsFocused(false)
  }

  return (
    <>
      <div
        className={[
          'flex items-center justify-between transition',
          'rounded-md bg-studio border px-3.5 py-2 w-[200px]',
          borderClassName,
        ].join(' ')}
      >
        <Clock className="text-foreground-light" size={18} strokeWidth={1.5} />
        <Tooltip>
          <TooltipTrigger className="w-1/4" tabIndex={-1}>
            <input
              type="text"
              maxLength={2}
              pattern="[0-9]*"
              placeholder="HH"
              value={formatNumberToTwoDigits(time.h)}
              onFocus={onFocus}
              aria-label="Hours"
              onBlur={(event) => onInputBlur(event, 'h')}
              onChange={(event) => onInputChange(event, 'h')}
              className="w-full text-sm bg-transparent p-0 text-center outline-hidden border-none focus:ring-0"
            />
          </TooltipTrigger>

          <TooltipContent side="bottom">Hours (HH)</TooltipContent>
        </Tooltip>
        <span>:</span>
        <Tooltip>
          <TooltipTrigger className="w-1/4" tabIndex={-1}>
            <input
              type="text"
              maxLength={2}
              pattern="[0-9]*"
              placeholder="MM"
              value={formatNumberToTwoDigits(time.m)}
              onFocus={onFocus}
              aria-label="Minutes"
              onBlur={(event) => onInputBlur(event, 'm')}
              onChange={(event) => onInputChange(event, 'm')}
              className="w-full text-sm bg-transparent p-0 text-center outline-hidden border-none focus:ring-0"
            />
          </TooltipTrigger>

          <TooltipContent side="bottom">Minutes (MM)</TooltipContent>
        </Tooltip>
        <span>:</span>
        <Tooltip>
          <TooltipTrigger className="w-1/4" tabIndex={-1}>
            <input
              type="text"
              maxLength={2}
              pattern="[0-9]*"
              placeholder="SS"
              value={formatNumberToTwoDigits(time.s)}
              onFocus={onFocus}
              aria-label="Seconds"
              onBlur={(event) => onInputBlur(event, 's')}
              onChange={(event) => onInputChange(event, 's')}
              className="w-full text-sm bg-transparent p-0 text-center outline-hidden border-none focus:ring-0"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">Seconds (SS)</TooltipContent>
        </Tooltip>
      </div>
      {visibleError && <p className="text-sm text-red-900">{visibleError}</p>}
    </>
  )
}

export default TimeInput

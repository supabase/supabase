import * as Tooltip from '@radix-ui/react-tooltip'
import dayjs from 'dayjs'
import { isNaN, noop } from 'lodash'
import { ChangeEvent, useEffect, useState } from 'react'
import { IconClock } from 'ui'

import { Time } from './PITR.types'
import { formatNumberToTwoDigits, formatTimeToTimeString } from './PITR.utils'

// [Joshen] This is trying to do the same thing as TimeSplitInput.tsx
// so can we please look to try to combine these 2 components together if possible
// The problem with TimeSplitInput is that it's tightly coupled to the date + its
// tightly coupled to the context of a range. Ideally it should be more modular
// which is what this component is trying to achieve

// [Joshen] Potential extension, give option to toggle 24 hours or AM/PM

interface TimeInputProps {
  defaultTime?: Time
  minimumTime?: Time
  maximumTime?: Time
  onChange?: (time: Time) => void
}

const TimeInput = ({ defaultTime, minimumTime, maximumTime, onChange = noop }: TimeInputProps) => {
  const [isFocused, setIsFocused] = useState(false)
  const [error, setError] = useState<string>()
  const [time, setTime] = useState<Time>(defaultTime || { h: 0, m: 0, s: 0 })

  const formattedMinimumTime = minimumTime
    ? dayjs(formatTimeToTimeString(minimumTime), 'HH:mm:ss', true)
    : undefined

  const formattedMaximumTime = maximumTime
    ? dayjs(formatTimeToTimeString(maximumTime), 'HH:mm:ss', true)
    : undefined

  useEffect(() => {
    if (minimumTime || maximumTime) validate(time)
  }, [JSON.stringify(minimumTime), JSON.stringify(maximumTime)])

  useEffect(() => {
    if (defaultTime) {
      setTime(defaultTime)
      validate(defaultTime)
    }
  }, [defaultTime])

  const validate = (time: Time) => {
    let error = undefined
    const formattedTime = dayjs(formatTimeToTimeString(time), 'HH:mm:ss', true)

    if (!formattedTime.isValid()) {
      error = 'Please enter a valid time'
    } else if (formattedMinimumTime && formattedTime.isBefore(formattedMinimumTime)) {
      error = 'Selected time is before the minimum time allowed'
    } else if (formattedMaximumTime && formattedTime.isAfter(formattedMaximumTime)) {
      error = 'Selected time is after the maximum time allowed'
    }

    setError(error)
    return error === undefined
  }

  const onFocus = () => setIsFocused(true)

  const onInputChange = (event: ChangeEvent<HTMLInputElement>, unit: 'h' | 'm' | 's') => {
    if (isNaN(Number(event.target.value))) return
    setTime({ ...time, [unit]: event.target.value })
  }

  const onInputBlur = (event: ChangeEvent<HTMLInputElement>, unit: 'h' | 'm' | 's') => {
    const formattedInput = Number(event.target.value)
    const updatedTime = { ...time, [unit]: formattedInput }
    setTime(updatedTime)

    validate(updatedTime)
    onChange(updatedTime)
    setIsFocused(false)
  }

  return (
    <>
      <div
        className={[
          'flex items-center justify-between transition',
          'rounded-md bg-background border px-3.5 py-2 w-[200px]',
          `${
            isFocused ? 'border-stronger' : error === undefined ? 'border-strong' : 'border-red-800'
          }`,
        ].join(' ')}
      >
        <IconClock className="text-foreground-light" size={18} strokeWidth={1.5} />
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger className="w-1/4" tabIndex={-1}>
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
              className="w-full text-sm bg-transparent p-0 text-center outline-none border-none focus:ring-0"
            />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'bg-alternative rounded py-1 px-2 leading-none shadow',
                  'border-background border',
                ].join(' ')}
              >
                <span className="text-foreground text-xs">Hours (HH)</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        <span>:</span>
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger className="w-1/4" tabIndex={-1}>
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
              className="w-full text-sm bg-transparent p-0 text-center outline-none border-none focus:ring-0"
            />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'bg-alternative rounded py-1 px-2 leading-none shadow',
                  'border-background border',
                ].join(' ')}
              >
                <span className="text-foreground text-xs">Minutes (MM)</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        <span>:</span>
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger className="w-1/4" tabIndex={-1}>
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
              className="w-full text-sm bg-transparent p-0 text-center outline-none border-none focus:ring-0"
            />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'bg-alternative rounded py-1 px-2 leading-none shadow',
                  'border-background border',
                ].join(' ')}
              >
                <span className="text-foreground text-xs">Seconds (SS)</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
      {error && <p className="text-sm text-red-900">{error}</p>}
    </>
  )
}

export default TimeInput

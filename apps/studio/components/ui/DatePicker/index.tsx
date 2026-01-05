import { format } from 'date-fns'
import dayjs from 'dayjs'
import { ArrowRight, Calendar } from 'lucide-react'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import type { DatePickerToFrom } from 'components/interfaces/Settings/Logs/Logs.types'
import {
  Button,
  Calendar as CalendarPicker,
  PopoverContent,
  PopoverTrigger,
  Popover,
  PopoverSeparator,
} from 'ui'
import { ButtonProps } from 'ui/src/components/Button/Button'
import { TimeSplitInput } from './TimeSplitInput'

interface DatePickerProps {
  onChange?: (args: DatePickerToFrom) => void
  to?: string // ISO string
  from?: string // ISO string
  triggerButtonType?: ButtonProps['type']
  triggerButtonClassName?: string
  triggerButtonTitle?: string
  triggerButtonSize?: 'tiny' | 'small'
  contentSide?: 'bottom' | 'top'
  minDate?: Date
  maxDate?: Date
  hideTime?: boolean
  hideClear?: boolean
  selectsRange?: boolean
  renderFooter?: (args: DatePickerToFrom) => ReactNode | void
  children?: ReactNode | ReactNode[] | null
}

const START_DATE_DEFAULT = new Date()
const END_DATE_DEFAULT = new Date()

const START_TIME_DEFAULT = { HH: '00', mm: '00', ss: '00' }
const END_TIME_DEFAULT = { HH: '23', mm: '59', ss: '59' }

const calculateDisabledDays = (minDate?: Date, maxDate?: Date) => {
  const rules: Array<{ before: Date } | { after: Date }> = []

  if (minDate) {
    rules.push({ before: dayjs(minDate).startOf('day').toDate() })
  }

  if (maxDate) {
    rules.push({ after: dayjs(maxDate).endOf('day').toDate() })
  }

  if (rules.length === 0) return undefined
  if (rules.length === 1) return rules[0]
  return rules
}

export function DatePicker({
  to,
  from,
  onChange,
  triggerButtonType = 'default',
  triggerButtonClassName = '',
  triggerButtonTitle,
  triggerButtonSize,
  contentSide = 'bottom',
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

  const disabledDays = useMemo(() => calculateDisabledDays(minDate, maxDate), [minDate, maxDate])

  const clampDateToRange = useCallback(
    (date: Date | null) => {
      if (!date) return date

      let nextDate = date

      if (minDate && dayjs(nextDate).isBefore(minDate, 'day')) {
        nextDate = dayjs(minDate).toDate()
      }

      if (maxDate && dayjs(nextDate).isAfter(maxDate, 'day')) {
        nextDate = dayjs(maxDate).toDate()
      }

      return nextDate
    },
    [minDate, maxDate]
  )

  useEffect(() => {
    if (!minDate && !maxDate) return

    setStartDate((prev) => {
      if (!prev) return prev
      const clamped = clampDateToRange(prev)
      return dayjs(clamped).isSame(prev) ? prev : clamped
    })

    setEndDate((prev) => {
      if (!prev) return prev
      const clamped = clampDateToRange(prev)
      return dayjs(clamped).isSame(prev) ? prev : clamped
    })

    setAppliedStartDate((prev) => {
      if (!prev) return prev
      const clamped = clampDateToRange(prev)
      return dayjs(clamped).isSame(prev) ? prev : clamped
    })

    setAppliedEndDate((prev) => {
      if (!prev) return prev
      const clamped = clampDateToRange(prev)
      return dayjs(clamped).isSame(prev) ? prev : clamped
    })
  }, [minDate, maxDate, clampDateToRange])

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
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          title={triggerButtonTitle}
          type={triggerButtonType}
          icon={<Calendar />}
          size={triggerButtonSize}
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
      </PopoverTrigger>
      <PopoverContent align="center" side={contentSide} className="p-0">
        <>
          {hideTime ? null : (
            <>
              <div className="flex items-stretch justify-between p-2">
                {!selectsRange ? null : (
                  <>
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
                    <div className="flex items-center justify-center w-12 text-foreground-lighter">
                      <ArrowRight strokeWidth={1.5} size={14} />
                    </div>
                  </>
                )}
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
          )}
          <div className="p-2">
            {selectsRange ? (
              <CalendarPicker
                mode="range"
                disabled={disabledDays}
                selected={{ from: startDate ?? undefined, to: endDate ?? undefined }}
                onSelect={(range) => {
                  handleDatePickerChange([range?.from ?? null, range?.to ?? null])
                }}
              />
            ) : (
              <CalendarPicker
                mode="single"
                disabled={disabledDays}
                selected={endDate ?? undefined}
                onSelect={(date) => {
                  handleDatePickerChange(date ?? null)
                }}
              />
            )}
          </div>
          {renderFooter({
            from: startDate?.toISOString() || null,
            to: endDate?.toISOString() || null,
          })}
          <PopoverSeparator />
          <div className="flex items-center justify-end gap-2 py-2 px-3 pb-4">
            {!hideClear && (
              <Button type="default" onClick={() => handleClear()}>
                Clear
              </Button>
            )}
            <Button onClick={() => handleSubmit()}>Apply</Button>
          </div>
        </>
      </PopoverContent>
    </Popover>
  )
}

/* eslint-disable react-hooks/exhaustive-deps */
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, Clock, XIcon } from 'lucide-react'
import { PropsWithChildren, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'

import { Label } from '@ui/components/shadcn/ui/label'
import { Badge } from '@ui/components/shadcn/ui/badge'
import { RadioGroup, RadioGroupItem } from '@ui/components/shadcn/ui/radio-group'
import TimeSplitInput from 'components/ui/DatePicker/TimeSplitInput'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import {
  Button,
  ButtonProps,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
  copyToClipboard,
} from 'ui'
import { LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD } from './Logs.constants'
import type { DatetimeHelper } from './Logs.types'

export type DatePickerValue = {
  to: string
  from: string
  isHelper?: boolean
  text?: string
}

interface Props {
  value: DatePickerValue
  helpers: DatetimeHelper[]
  onSubmit: (value: DatePickerValue) => void
  buttonTriggerProps?: ButtonProps
  popoverContentProps?: typeof PopoverContent_Shadcn_
}

export const LogsDatePicker = ({
  onSubmit,
  helpers,
  value,
  buttonTriggerProps,
  popoverContentProps,
}: PropsWithChildren<Props>) => {
  const [open, setOpen] = useState(false)

  // Reset the state when the popover closes
  useEffect(() => {
    if (!open) {
      setStartDate(value.from ? new Date(value.from) : null)
      setEndDate(value.to ? new Date(value.to) : new Date())

      const fromDate = value.from ? new Date(value.from) : null
      const toDate = value.to ? new Date(value.to) : null

      setStartTime({
        HH: fromDate?.getHours().toString().padStart(2, '0') || '00',
        mm: fromDate?.getMinutes().toString().padStart(2, '0') || '00',
        ss: fromDate?.getSeconds().toString().padStart(2, '0') || '00',
      })

      const now = new Date()
      const nowHH = now.getHours().toString().padStart(2, '0')
      const nowMM = now.getMinutes().toString().padStart(2, '0')
      const nowSS = now.getSeconds().toString().padStart(2, '0')

      setEndTime({
        HH: toDate?.getHours().toString().padStart(2, '0') || nowHH,
        mm: toDate?.getMinutes().toString().padStart(2, '0') || nowMM,
        ss: toDate?.getSeconds().toString().padStart(2, '0') || nowSS,
      })
    }
  }, [open, value])

  const handleHelperChange = (newValue: string) => {
    const selectedHelper = helpers.find((h) => h.text === newValue)
    if (onSubmit && selectedHelper) {
      onSubmit({
        to: selectedHelper.calcTo(),
        from: selectedHelper.calcFrom(),
        isHelper: true,
        text: selectedHelper.text,
      })
    }

    setOpen(false)
  }

  const [startDate, setStartDate] = useState<Date | null>(value.from ? new Date(value.from) : null)
  const [endDate, setEndDate] = useState<Date | null>(value.to ? new Date(value.to) : new Date())

  const [startTime, setStartTime] = useState({
    HH: startDate?.getHours().toString() || '00',
    mm: startDate?.getMinutes().toString() || '00',
    ss: startDate?.getSeconds().toString() || '00',
  })
  const [endTime, setEndTime] = useState({
    HH: endDate?.getHours().toString() || '23',
    mm: endDate?.getMinutes().toString() || '59',
    ss: endDate?.getSeconds().toString() || '59',
  })

  function handleDatePickerChange(dates: [from: Date | null, to: Date | null]) {
    const [from, to] = dates

    setStartDate(from)
    setEndDate(to)
  }

  function handleApply() {
    const from = startDate || new Date()
    const to = endDate || new Date()

    // Add Time to the dates
    const finalFrom = new Date(from.setHours(+startTime.HH, +startTime.mm, +startTime.ss))
    const finalTo = new Date(to.setHours(+endTime.HH, +endTime.mm, +endTime.ss))

    onSubmit({
      from: finalFrom.toISOString(),
      to: finalTo.toISOString(),
      isHelper: false,
    })

    setOpen(false)
  }

  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState(false)

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }, [copied])

  function handlePaste() {
    navigator.clipboard
      .readText()
      .then((text) => {
        try {
          const json = JSON.parse(text)

          if (!json.from || !json.to) {
            console.warn('Invalid date range format in clipboard')
            return
          }

          const fromDate = new Date(json.from)
          const toDate = new Date(json.to)

          // Check if dates are valid
          if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            console.warn('Invalid date values in clipboard')
            return
          }

          setStartDate(fromDate)
          setEndDate(toDate)

          // Update time states
          setStartTime({
            HH: fromDate.getHours().toString(),
            mm: fromDate.getMinutes().toString(),
            ss: fromDate.getSeconds().toString(),
          })

          setEndTime({
            HH: toDate.getHours().toString(),
            mm: toDate.getMinutes().toString(),
            ss: toDate.getSeconds().toString(),
          })

          setPasted(true)
        } catch (error) {
          console.warn('Failed to parse clipboard content as date range:', error)
        }
      })
      .catch((error) => {
        console.warn('Failed to read clipboard:', error)
      })
  }

  function handleCopy() {
    if (!startDate || !endDate) return

    const fromDate = new Date(startDate)
    const toDate = new Date(endDate)

    // Add time from time states
    fromDate.setHours(+startTime.HH, +startTime.mm, +startTime.ss)
    toDate.setHours(+endTime.HH, +endTime.mm, +endTime.ss)

    copyToClipboard(
      JSON.stringify({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      })
    )

    setCopied(true)
  }

  useEffect(() => {
    if (pasted) {
      setTimeout(() => {
        setPasted(false)
      }, 2000)
    }
  }, [pasted])

  useEffect(() => {
    if (open) {
      document.addEventListener('paste', handlePaste)
      document.addEventListener('copy', handleCopy)
    }
    return () => {
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('copy', handleCopy)
    }
  }, [open, startDate, endDate])

  const isLargeRange =
    Math.abs(dayjs(startDate).diff(dayjs(endDate), 'days')) >
    LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD - 1

  const { plan: orgPlan, isLoading: isOrgPlanLoading } = useCurrentOrgPlan()
  const showHelperBadge = (helper?: DatetimeHelper) => {
    if (!helper) return false
    if (!helper.availableIn?.length) return false

    if (helper.availableIn.includes('free')) return false
    if (helper.availableIn.includes(orgPlan?.id || 'free') && !isOrgPlanLoading) return false
    return true
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="default" icon={<Clock size={12} />} {...buttonTriggerProps}>
          {value.isHelper
            ? value.text
            : `${dayjs(value.from).format('DD MMM, HH:mm')} - ${dayjs(value.to || new Date()).format('DD MMM, HH:mm')}`}
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        className="flex w-full p-0"
        side="bottom"
        align="end"
        portal={true}
        {...popoverContentProps}
      >
        <RadioGroup
          onValueChange={handleHelperChange}
          value={value.isHelper ? value.text : ''}
          className="border-r p-2 flex flex-col gap-px"
        >
          {helpers.map((helper) => (
            <Label
              key={helper.text}
              className={cn(
                '[&:has([data-state=checked])]:bg-background-overlay-hover [&:has([data-state=checked])]:text-foreground px-4 py-1.5 text-foreground-light flex items-center gap-2 hover:bg-background-overlay-hover hover:text-foreground transition-all rounded-sm text-xs w-full',
                {
                  'cursor-not-allowed pointer-events-none opacity-50': helper.disabled,
                }
              )}
            >
              <RadioGroupItem
                hidden
                key={helper.text}
                value={helper.text}
                disabled={helper.disabled}
                aria-disabled={helper.disabled}
              ></RadioGroupItem>
              {helper.text}
              {showHelperBadge(helper) ? (
                <Badge
                  size="small"
                  variant="outline"
                  className="h-5 text-[10px] text-foreground-light capitalize"
                >
                  {helper.availableIn?.[0] || ''}
                </Badge>
              ) : null}
            </Label>
          ))}
        </RadioGroup>

        <div>
          <div className="flex p-2 gap-2 items-center">
            <div className="flex flex-grow *:flex-grow gap-2 font-mono">
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
            <div className="flex-shrink">
              <Button
                icon={<XIcon size={14} />}
                type="text"
                size="tiny"
                className="px-1.5"
                onClick={() => {
                  setStartTime({ HH: '00', mm: '00', ss: '00' })
                  setEndTime({ HH: '00', mm: '00', ss: '00' })
                }}
              ></Button>
            </div>
          </div>
          <div className="p-2 border-t">
            <DatePicker
              inline
              selectsRange
              onChange={(dates) => {
                handleDatePickerChange(dates)
              }}
              dateFormat="MMMM d, yyyy h:mm aa"
              dayClassName={() => 'cursor-pointer'}
              startDate={startDate}
              endDate={endDate}
              renderCustomHeader={({
                date,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => (
                <div className="flex items-center justify-between">
                  <div className="flex w-full items-center justify-between">
                    <Button
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                      icon={<ChevronLeft size={14} strokeWidth={2} />}
                      type="text"
                      size="tiny"
                      className="px-1.5"
                    ></Button>
                    <span className="text-sm text-foreground-light">
                      {dayjs(date).format('MMMM YYYY')}
                    </span>
                    <Button
                      onClick={increaseMonth}
                      disabled={nextMonthButtonDisabled}
                      icon={<ChevronRight size={14} strokeWidth={2} />}
                      type="text"
                      size="tiny"
                      className="px-1.5"
                    ></Button>
                  </div>
                </div>
              )}
            />
          </div>
          {isLargeRange && (
            <div className="text-xs px-3 py-1.5 border-y bg-warning-300 text-warning-foreground border-warning-500 text-warning-600">
              Large ranges may result in memory errors for <br /> big projects.
            </div>
          )}
          <div className="flex items-center justify-end gap-2 p-2 border-t">
            {startDate && endDate ? (
              <Button
                type="text"
                size="tiny"
                onClick={handleCopy}
                className={cn({
                  'text-brand-600': copied || pasted,
                })}
              >
                {copied ? 'Copied!' : pasted ? 'Pasted!' : 'Copy range'}
              </Button>
            ) : null}

            <Button
              type="default"
              onClick={() => {
                setStartDate(new Date())
                setEndDate(new Date())
              }}
            >
              Today
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

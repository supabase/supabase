import dayjs from 'dayjs'
import { Clock, HistoryIcon } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge } from '@ui/components/shadcn/ui/badge'
import { Label } from '@ui/components/shadcn/ui/label'
import { RadioGroup, RadioGroupItem } from '@ui/components/shadcn/ui/radio-group'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { TimeSplitInput } from 'components/ui/DatePicker/TimeSplitInput'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import {
  Button,
  ButtonProps,
  Calendar,
  PopoverContent,
  PopoverTrigger,
  Popover,
  Input_Shadcn_,
  cn,
  copyToClipboard,
} from 'ui'
import { LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD } from './Logs.constants'
import type { DatetimeHelper } from './Logs.types'
import type { PlanId } from 'data/subscriptions/types'

type Unit = 'minute' | 'hour' | 'day'

export type ParsedCustomInput =
  | { type: 'number'; value: number }
  | { type: 'unit'; value: number; unit: Unit }
  | { type: 'invalid' }

export const parseCustomInput = (input: string): ParsedCustomInput => {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return { type: 'invalid' }

  // Try to match "number + optional space + unit prefix"
  const match = trimmed.match(/^(\d+)\s*([a-z]*)$/)
  if (!match) return { type: 'invalid' }

  const [, numStr, unitStr] = match
  const value = parseInt(numStr, 10)

  if (isNaN(value) || value <= 0) return { type: 'invalid' }

  if (!unitStr) {
    return { type: 'number', value }
  }

  // Match if unitStr is a prefix of any unit name or its first letter
  const units: Unit[] = ['minute', 'hour', 'day']
  const matchedUnit = units.find((u) => u.startsWith(unitStr) || u[0] === unitStr)

  if (!matchedUnit) return { type: 'invalid' }

  return { type: 'unit', value, unit: matchedUnit }
}

export const getAvailableInForDays = (days: number): PlanId[] => {
  if (days <= 1) return ['free', 'pro', 'team', 'enterprise', 'platform']
  if (days <= 7) return ['pro', 'team', 'enterprise', 'platform']
  return ['team', 'enterprise', 'platform']
}

export const convertToDays = (value: number, unit: Unit): number => {
  switch (unit) {
    case 'minute':
      return value / (60 * 24)
    case 'hour':
      return value / 24
    case 'day':
      return value
  }
}

export const generateDynamicHelper = (value: number, unit: Unit): DatetimeHelper => {
  const days = convertToDays(value, unit)
  return {
    text: `Last ${value} ${unit}${value === 1 ? '' : 's'}`,
    calcFrom: () => dayjs().subtract(value, unit).toISOString(),
    calcTo: () => dayjs().toISOString(),
    availableIn: getAvailableInForDays(days),
  }
}

export const generateDynamicHelpers = (value: number): DatetimeHelper[] => {
  const units: Unit[] = ['minute', 'hour', 'day']
  return units.map((unit) => generateDynamicHelper(value, unit))
}

export const generateHelpersFromInput = (input: string): DatetimeHelper[] | null => {
  const parsed = parseCustomInput(input)

  switch (parsed.type) {
    case 'number':
      return generateDynamicHelpers(parsed.value)
    case 'unit':
      return [generateDynamicHelper(parsed.value, parsed.unit)]
    case 'invalid':
      return null
  }
}

export type DatePickerValue = {
  to: string
  from: string
  isHelper?: boolean
  text?: string
}

interface LogsDatePickerProps {
  value: DatePickerValue
  helpers: DatetimeHelper[]
  onSubmit: (value: DatePickerValue) => void
  buttonTriggerProps?: ButtonProps
  popoverContentProps?: typeof PopoverContent
  hideWarnings?: boolean
  align?: 'start' | 'end' | 'center'
}

export const LogsDatePicker = ({
  onSubmit,
  helpers,
  value,
  buttonTriggerProps,
  popoverContentProps,
  hideWarnings,
  align = 'end',
}: PropsWithChildren<LogsDatePickerProps>) => {
  const [open, setOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const displayedHelpers = useMemo(() => {
    if (!customValue.trim()) return helpers
    const generated = generateHelpersFromInput(customValue)
    return generated ?? []
  }, [customValue, helpers])

  // Reset the state when the popover closes
  useEffect(() => {
    if (!open) {
      setCustomValue('')
      setStartDate(value.from ? new Date(value.from) : null)
      const defaultEndDate = value.to ? new Date(value.to) : new Date()
      setEndDate(defaultEndDate)
      setCurrentMonth(new Date(defaultEndDate))

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
    const selectedHelper = displayedHelpers.find((h) => h.text === newValue)
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
  const [currentMonth, setCurrentMonth] = useState<Date>(() =>
    value.to ? new Date(value.to) : new Date()
  )

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
          setCurrentMonth(new Date(toDate))

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

  const handleCopy = useCallback(() => {
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
  }, [startDate, endDate, startTime, endTime])

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
  }, [open, startDate, endDate, handleCopy])

  const isLargeRange =
    Math.abs(dayjs(startDate).diff(dayjs(endDate), 'days')) >
    LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD - 1

  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToAuditLogDays = getEntitlementNumericValue()

  const showHelperBadge = (helper?: DatetimeHelper) => {
    if (!helper) return false
    if (!helper.availableIn?.length) return false
    if (!entitledToAuditLogDays) return false

    const day = Math.abs(dayjs().diff(dayjs(helper.calcFrom()), 'day'))
    if (day <= entitledToAuditLogDays) return false
    return true
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="default" icon={<Clock size={12} />} {...buttonTriggerProps}>
          {value.isHelper
            ? value.text
            : `${dayjs(value.from).format('DD MMM, HH:mm')} - ${dayjs(value.to || new Date()).format('DD MMM, HH:mm')}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-full p-0"
        side="bottom"
        align={align}
        portal={true}
        {...popoverContentProps}
      >
        <div className="border-r p-2 flex flex-col gap-px">
          <Input_Shadcn_
            type="text"
            placeholder="e.g. 2h, 30m, 7d"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="mb-2 text-xs h-7 rounded-sm"
          />
          <RadioGroup
            onValueChange={handleHelperChange}
            value={value.isHelper ? value.text : ''}
            className="flex flex-col gap-px"
          >
            {displayedHelpers.map((helper) => (
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
                {showHelperBadge(helper) ? <Badge>{helper.availableIn?.[0] || ''}</Badge> : null}
              </Label>
            ))}
          </RadioGroup>
        </div>

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
              <ButtonTooltip
                tooltip={{
                  content: {
                    text: 'Clear time range',
                  },
                }}
                icon={<HistoryIcon size={14} />}
                type="text"
                size="tiny"
                className="px-1.5"
                onClick={() => {
                  setStartTime({ HH: '00', mm: '00', ss: '00' })
                  setEndTime({ HH: '00', mm: '00', ss: '00' })
                }}
              ></ButtonTooltip>
            </div>
          </div>
          <div className="p-2 border-t">
            <Calendar
              mode="range"
              month={currentMonth}
              onMonthChange={(month) => setCurrentMonth(new Date(month))}
              selected={{ from: startDate ?? undefined, to: endDate ?? undefined }}
              onSelect={(range) => {
                handleDatePickerChange([range?.from ?? null, range?.to ?? null])
              }}
            />
          </div>
          {isLargeRange && !hideWarnings && (
            <div className="text-xs px-3 py-1.5 border-y bg-warning-300 text-warning-foreground border-warning-500 text-warning">
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
                const today = new Date()
                setCurrentMonth(today)
                setStartDate(new Date(today))
                setEndDate(new Date(today))
              }}
            >
              Today
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

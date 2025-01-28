import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

import { DATE_FORMAT } from 'lib/constants'
import { ChevronDown } from 'lucide-react'

/**
 * There's timestamp rounding that kicks in if there are more than 50 data points
 * being returned, in order to increase cache hit rates.
 * Ensure that whenever we create a new period_start under handleChange, it should return
 * at point 50 data points. (e.g 3 hours, 5 mins interval = 36 points)
 * Otherwise there won't be any data shown on the graphs
 */

interface DateRangePickerProps {
  value: string
  loading: boolean
  onChange: ({
    period_start,
    period_end,
    interval,
  }: {
    period_start: { date: string; time_period: string }
    period_end: { date: string; time_period: string }
    interval?: string
  }) => void
  options: { key: string; label: string; interval?: string }[]
  currentBillingPeriodStart?: number
  currentBillingPeriodEnd?: number
}

const DateRangePicker = ({
  onChange,
  value,
  options,
  loading,
  currentBillingPeriodStart,
  currentBillingPeriodEnd,
}: DateRangePickerProps) => {
  const [timePeriod, setTimePeriod] = useState(value)

  useEffect(() => {
    handleChange(value)
  }, [loading])

  const startOfMonth = dayjs().startOf('month').format(DATE_FORMAT)
  const nextMonth = dayjs().add(1, 'month').startOf('month').format(DATE_FORMAT)

  const today = dayjs().format(DATE_FORMAT)

  function handleChange(x: any) {
    setTimePeriod(x)

    switch (x) {
      // please note: these are fixed date ranges based on subscription
      // billing cycles are always assumed to be 1 month long
      // only currentPeriodStart is used to calculate dates
      case 'currentBillingCycle':
        onChange({
          period_start: {
            date: dayjs.unix(currentBillingPeriodStart ?? 0).format(DATE_FORMAT),
            time_period: '1d',
          },
          period_end: {
            date: dayjs.unix(currentBillingPeriodEnd ?? 0).format(DATE_FORMAT),
            time_period: 'today',
          },
          interval: '1d',
        })
        break
      case 'previousBillingCycle':
        onChange({
          period_start: {
            date: dayjs
              .unix(currentBillingPeriodStart ?? 0)
              .subtract(1, 'month')
              .format(DATE_FORMAT),
            time_period: '1d',
          },
          period_end: {
            date: dayjs.unix(currentBillingPeriodStart ?? 0).format(DATE_FORMAT),
            time_period: 'today',
          },
          interval: '1d',
        })
        break
      // all other time periods below are based on current date and time
      // they will generate flexible dynamic date ranges
      case '1d':
        onChange({
          period_start: {
            date: dayjs().subtract(24, 'hour').format(DATE_FORMAT),
            time_period: '1d',
          },
          period_end: {
            date: today,
            time_period: 'today',
          },
          interval: '1h',
        })
        break
      case '3h':
        onChange({
          period_start: {
            date: dayjs().subtract(3, 'hour').format(DATE_FORMAT),
            time_period: '3h',
          },
          period_end: {
            date: today,
            time_period: 'today',
          },
          interval: '5m',
        })
        break
      case '1h':
        onChange({
          period_start: {
            date: dayjs().subtract(1, 'hour').format(DATE_FORMAT),
            time_period: '1h',
          },
          period_end: {
            date: today,
            time_period: 'today',
          },
          interval: '5m',
        })
        break
      case '7d':
        onChange({
          period_start: {
            date: dayjs().subtract(7, 'day').format(DATE_FORMAT),
            time_period: '7d',
          },
          period_end: {
            date: today,
            time_period: 'today',
          },
          interval: '1d',
        })
        break
      case '30d':
        onChange({
          period_start: {
            date: dayjs().subtract(30, 'day').format(DATE_FORMAT),
            time_period: '30d',
          },
          period_end: {
            date: today,
            time_period: 'today',
          },
          interval: '1d',
        })
        break
      case '60d':
        onChange({
          period_start: {
            date: dayjs().subtract(60, 'day').format(DATE_FORMAT),
            time_period: '60d',
          },
          period_end: {
            date: today,
            time_period: 'today',
          },
          interval: '3d',
        })
        break
      case 'startMonth':
        onChange({
          period_start: {
            date: startOfMonth,
            time_period: 'startMonth',
          },
          period_end: {
            date: nextMonth,
            time_period: 'endMonth',
          },
          interval: '1d',
        })
        break

      default:
        console.warn(`Unknown period encountered: ${x}`)
        break
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" iconRight={<ChevronDown />}>
            <span>{timePeriod && options.find((x) => x.key === timePeriod)?.label}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="start">
          <DropdownMenuRadioGroup value={timePeriod} onValueChange={(x) => handleChange(x)}>
            {options.map((option) => {
              return (
                <DropdownMenuRadioItem value={option.key} key={option.key}>
                  {option.label}
                </DropdownMenuRadioItem>
              )
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export default DateRangePicker

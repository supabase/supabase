import { useState, useCallback } from 'react'
import dayjs from 'dayjs'
import { DatePickerValue } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { createFilteredDatePickerHelpers } from 'components/interfaces/Reports/Reports.constants'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'

export interface ReportDateRange {
  period_start: { date: string; time_period: string }
  period_end: { date: string; time_period: string }
  interval: string
}

export const useReportDateRange = (defaultDays: number = 7) => {
  const { plan: orgPlan, isLoading: isOrgPlanLoading } = useCurrentOrgPlan()

  // Get filtered date picker helpers based on organization plan
  const datePickerHelpers = createFilteredDatePickerHelpers(orgPlan?.id || 'free')

  // Find a suitable default helper based on defaultDays
  const getDefaultHelper = () => {
    // Map common defaultDays values to helper text
    const helperMap: Record<number, string> = {
      1: 'Last 24 hours',
      7: 'Last 7 days',
      14: 'Last 14 days',
      28: 'Last 28 days',
    }

    const targetText = helperMap[defaultDays]
    const helper = datePickerHelpers.find((h) => h.text === targetText && !h.disabled)

    if (helper) {
      return {
        start: helper.calcFrom(),
        end: helper.calcTo(),
        helper: { isHelper: true, text: helper.text },
      }
    }

    // Fallback to manual date calculation
    const defaultStart = dayjs().subtract(defaultDays, 'day').toISOString()
    const defaultEnd = dayjs().toISOString()
    return {
      start: defaultStart,
      end: defaultEnd,
      helper: { isHelper: false },
    }
  }

  const { start: defaultStart, end: defaultEnd, helper: defaultHelper } = getDefaultHelper()

  const [selectedDateRange, setSelectedDateRange] = useState<ReportDateRange>({
    period_start: { date: defaultStart, time_period: '1d' },
    period_end: { date: defaultEnd, time_period: 'today' },
    interval: '1h',
  })

  // Track whether current selection is from a helper/preset
  const [currentHelper, setCurrentHelper] = useState<{
    isHelper: boolean
    text?: string
  }>(defaultHelper)

  const handleIntervalGranularity = useCallback((from: string, to: string) => {
    const conditions = {
      '1m': dayjs(to).diff(from, 'hour') < 3, // less than 3 hours
      '10m': dayjs(to).diff(from, 'hour') < 6, // less than 6 hours
      '30m': dayjs(to).diff(from, 'hour') < 18, // less than 18 hours
      '1h': dayjs(to).diff(from, 'day') < 10, // less than 10 days
      '1d': dayjs(to).diff(from, 'day') >= 10, // more than 10 days
    }

    switch (true) {
      case conditions['1m']:
        return '1m'
      case conditions['10m']:
        return '10m'
      case conditions['30m']:
        return '30m'
      default:
        return '1h'
    }
  }, [])

  const updateDateRange = useCallback(
    (from: string, to: string) => {
      setSelectedDateRange({
        period_start: { date: from, time_period: '1d' },
        period_end: { date: to, time_period: 'today' },
        interval: handleIntervalGranularity(from, to),
      })
      // Reset helper state when manually updating date range
      setCurrentHelper({ isHelper: false })
    },
    [handleIntervalGranularity]
  )

  const handleDatePickerChange = useCallback(
    (values: DatePickerValue) => {
      if (values.from && values.to) {
        updateDateRange(values.from, values.to)
        // Update helper state based on whether this was a preset selection
        setCurrentHelper({
          isHelper: values.isHelper || false,
          text: values.text,
        })
      }
    },
    [updateDateRange]
  )

  // Convert to DatePickerValue format for LogsDatePicker
  const datePickerValue: DatePickerValue = {
    from: selectedDateRange.period_start.date,
    to: selectedDateRange.period_end.date,
    isHelper: currentHelper.isHelper,
    text: currentHelper.text,
  }

  return {
    selectedDateRange,
    setSelectedDateRange,
    updateDateRange,
    handleDatePickerChange,
    datePickerValue,
    datePickerHelpers,
    isOrgPlanLoading,
    orgPlan,
  }
}

import {
  REPORT_DATERANGE_HELPER_LABELS,
  REPORTS_DATEPICKER_HELPERS,
  ReportsDatetimeHelper,
} from 'components/interfaces/Reports/Reports.constants'
import { DatePickerValue } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { maybeShowUpgradePrompt } from 'components/interfaces/Settings/Logs/Logs.utils'
import { AnalyticsInterval } from 'data/analytics/constants'
import dayjs from 'dayjs'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { createParser, useQueryState } from 'nuqs'
import { useCallback, useMemo, useState } from 'react'

export const DATERANGE_LIMITS: { [key: string]: number } = {
  free: 1,
  pro: 7,
  team: 28,
  enterprise: 90,
  platform: 1,
}

export interface ReportDateRange {
  period_start: { date: string; time_period: string }
  period_end: { date: string; time_period: string }
  interval: AnalyticsInterval
}

// Create parsers for individual URL parameters
const stringWithDefault = (defaultValue: string) =>
  createParser({
    parse: (v) => v ?? defaultValue,
    serialize: (v) => v || '',
  })

const booleanWithDefault = (defaultValue: boolean) =>
  createParser({
    parse: (v) => {
      if (v === 'true') return true
      if (v === 'false') return false
      return defaultValue
    },
    serialize: (v) => String(v),
  })

export const useReportDateRange = (
  defaultHelper:
    | REPORT_DATERANGE_HELPER_LABELS
    | string
    | ReportsDatetimeHelper = REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES,
  useV2Granularity = false
) => {
  const { plan: orgPlan, isLoading: isOrgPlanLoading } = useCurrentOrgPlan()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  // Get filtered date picker helpers based on organization plan
  const datePickerHelpers: ReportsDatetimeHelper[] = useMemo(
    () =>
      REPORTS_DATEPICKER_HELPERS.map((helper) => ({
        ...helper,
        disabled: false,
      })),
    []
  )

  // Use nuqs for URL state management with individual parameters (empty defaults)
  const [timestampStartValue, setTimestampStart] = useQueryState('its', stringWithDefault(''))
  const [timestampEndValue, setTimestampEnd] = useQueryState('ite', stringWithDefault(''))
  const [isHelperValue, setIsHelper] = useQueryState('isHelper', booleanWithDefault(false))
  const [helperTextValue, setHelperText] = useQueryState('helperText', stringWithDefault(''))

  const getDefaultHelper = useCallback(() => {
    let targetHelper: ReportsDatetimeHelper | undefined

    if (typeof defaultHelper === 'string') {
      // Find helper by text (supports both enum values and direct strings)
      targetHelper = REPORTS_DATEPICKER_HELPERS.find((helper) => helper.text === defaultHelper)
    } else if (defaultHelper && typeof defaultHelper === 'object' && 'text' in defaultHelper) {
      // Use the provided helper object directly
      targetHelper = defaultHelper
    }

    // Check if the target helper is available for the current plan
    if (targetHelper && targetHelper.availableIn?.includes(orgPlan?.id || 'free')) {
      return {
        start: targetHelper.calcFrom(),
        end: targetHelper.calcTo(),
        helper: { isHelper: true, text: targetHelper.text },
      }
    }

    // Fallback: look for default helper marked in REPORTS_DATEPICKER_HELPERS
    const fallbackHelper = REPORTS_DATEPICKER_HELPERS.find(
      (helper) => helper.default && helper.availableIn?.includes(orgPlan?.id || 'free')
    )

    if (fallbackHelper) {
      return {
        start: fallbackHelper.calcFrom(),
        end: fallbackHelper.calcTo(),
        helper: { isHelper: true, text: fallbackHelper.text },
      }
    }

    // Final fallback: use first available helper
    const firstAvailable = REPORTS_DATEPICKER_HELPERS.find((helper) =>
      helper.availableIn?.includes(orgPlan?.id || 'free')
    )

    if (firstAvailable) {
      return {
        start: firstAvailable.calcFrom(),
        end: firstAvailable.calcTo(),
        helper: { isHelper: true, text: firstAvailable.text },
      }
    }

    // Ultimate fallback to manual date calculation (should rarely happen)
    const defaultStart = dayjs().subtract(1, 'hour').toISOString()
    const defaultEnd = dayjs().toISOString()
    return {
      start: defaultStart,
      end: defaultEnd,
      helper: { isHelper: false },
    }
  }, [defaultHelper, orgPlan?.id])

  // Get current effective values (from URL or defaults, but don't set URL)
  const timestampStart = useMemo(() => {
    if (timestampStartValue) {
      // Validate that stored date is reasonable
      const storedFrom = dayjs(timestampStartValue)
      const now = dayjs()
      if (
        storedFrom.isValid() &&
        storedFrom.isAfter(now.subtract(90, 'day')) &&
        storedFrom.isBefore(now.add(1, 'day'))
      ) {
        return timestampStartValue
      }
    }
    // Return default without setting URL
    return getDefaultHelper().start
  }, [timestampStartValue, getDefaultHelper])

  const timestampEnd = useMemo(() => {
    if (timestampEndValue) {
      // Validate that stored date is reasonable
      const storedTo = dayjs(timestampEndValue)
      const now = dayjs()
      if (
        storedTo.isValid() &&
        storedTo.isAfter(now.subtract(90, 'day')) &&
        storedTo.isBefore(now.add(1, 'day'))
      ) {
        return timestampEndValue
      }
    }
    // Return default without setting URL
    return getDefaultHelper().end
  }, [timestampEndValue, getDefaultHelper])

  // For helper state, use URL values or defaults from helper when no URL params exist
  const isHelper = useMemo(() => {
    if (timestampStartValue && timestampEndValue) {
      return Boolean(isHelperValue)
    }
    // If no URL params, get default from helper
    return getDefaultHelper().helper.isHelper
  }, [timestampStartValue, timestampEndValue, isHelperValue, getDefaultHelper])

  const helperText = useMemo(() => {
    if (timestampStartValue && timestampEndValue) {
      return helperTextValue || undefined
    }
    // If no URL params, get default from helper
    return getDefaultHelper().helper.text
  }, [timestampStartValue, timestampEndValue, helperTextValue, getDefaultHelper])

  const handleIntervalGranularity = (from: string, to: string): AnalyticsInterval => {
    const diffInDays = dayjs(to).diff(from, 'day', true)
    const diffInHours = dayjs(to).diff(from, 'hour', true)

    if (useV2Granularity) {
      if (diffInHours <= 1) return '1m'
      if (diffInHours <= 12) return '2m'
      if (diffInHours <= 24) return '10m'
      if (diffInDays <= 7) return '1h'
      return '1d'
    }

    const conditions = {
      '1m': diffInHours < 1.1, // less than 1.1 hours
      '5m': diffInHours < 3.1, // less than 3.1 hours
      '10m': diffInHours < 6.1, // less than 6.1 hours
      '30m': diffInHours < 25, // less than 25 hours
      '1h': diffInDays < 10, // less than 10 days
      '1d': diffInDays >= 10, // more than 10 days
    }

    switch (true) {
      case conditions['1m']:
        return '1m'
      case conditions['5m']:
        return '5m'
      case conditions['10m']:
        return '10m'
      case conditions['30m']:
        return '30m'
      default:
        return '1h'
    }
  }

  // Derive selectedDateRange from current values
  const selectedDateRange: ReportDateRange = useMemo(
    () => ({
      period_start: { date: timestampStart, time_period: '1d' },
      period_end: { date: timestampEnd, time_period: 'today' },
      interval: handleIntervalGranularity(timestampStart, timestampEnd),
    }),
    [timestampStart, timestampEnd, useV2Granularity]
  )

  const updateDateRange = useCallback(
    (from: string, to: string) => {
      setTimestampStart(from)
      setTimestampEnd(to)
      setIsHelper(false)
      setHelperText('')
    },
    [setTimestampStart, setTimestampEnd, setIsHelper, setHelperText]
  )

  // For backward compatibility, provide a setter that updates the derived state
  const setSelectedDateRange = useCallback(
    (newRange: ReportDateRange) => {
      setTimestampStart(newRange.period_start.date)
      setTimestampEnd(newRange.period_end.date)
      // When setting directly, assume it's not from a helper
      setIsHelper(false)
      setHelperText('')
    },
    [setTimestampStart, setTimestampEnd, setIsHelper, setHelperText]
  )

  // Convert to DatePickerValue format for LogsDatePicker
  const datePickerValue: DatePickerValue = useMemo(
    () => ({
      from: timestampStart,
      to: timestampEnd,
      isHelper,
      text: helperText,
    }),
    [timestampStart, timestampEnd, isHelper, helperText]
  )

  const handleDatePickerChange = (values: DatePickerValue) => {
    const shouldShowUpgradePrompt = maybeShowUpgradePrompt(values.from, orgPlan?.id)
    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
      return true
    } else {
      if (values.from && values.to) {
        setTimestampStart(values.from)
        setTimestampEnd(values.to)
        setIsHelper(values.isHelper || false)
        setHelperText(values.text || '')
      }
      return false
    }
  }

  return {
    selectedDateRange,
    setSelectedDateRange,
    updateDateRange,
    datePickerValue,
    datePickerHelpers,
    isOrgPlanLoading,
    orgPlan,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
  }
}

export function useRefreshHandler(
  datePickerValue: DatePickerValue,
  datePickerHelpers: ReportsDatetimeHelper[],
  handleDatePickerChange: (value: DatePickerValue) => boolean | void,
  refresh: () => void | Promise<void>
): () => void | Promise<void> {
  return useCallback(async () => {
    if (datePickerValue.isHelper && datePickerValue.text) {
      const selectedHelper = datePickerHelpers.find((h) => h.text === datePickerValue.text)
      if (selectedHelper) {
        handleDatePickerChange({
          from: selectedHelper.calcFrom(),
          to: selectedHelper.calcTo(),
          isHelper: true,
          text: selectedHelper.text,
        })
      }
    }

    await refresh()
  }, [datePickerValue, datePickerHelpers, handleDatePickerChange, refresh])
}

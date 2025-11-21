import { useMemo, useState } from 'react'
import type { DateRange } from 'react-day-picker'

import { REPORTS_DATEPICKER_HELPERS } from 'components/interfaces/Reports/Reports.constants'
import {
  DatePickerValue,
  LogsDatePicker,
} from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { maybeShowUpgradePromptIfNotEntitled } from 'components/interfaces/Settings/Logs/Logs.utils'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import type { DataTableTimerangeFilterField } from '../DataTable.types'
import { isArrayOfDates } from '../DataTable.utils'
import { useDataTable } from '../providers/DataTableProvider'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'

export function DataTableFilterTimerange<TData>({
  value: _value,
}: DataTableTimerangeFilterField<TData>) {
  const value = _value as string
  const { table, columnFilters } = useDataTable()
  const column = table.getColumn(value)
  const filterValue = columnFilters.find((i) => i.id === value)?.value

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToAuditLogDays = getEntitlementNumericValue()

  const date: DateRange | undefined = useMemo(
    () =>
      filterValue instanceof Date
        ? { from: filterValue, to: undefined }
        : Array.isArray(filterValue) && isArrayOfDates(filterValue)
          ? { from: filterValue?.[0], to: filterValue?.[1] }
          : undefined,
    [filterValue]
  )

  const handleDatePickerChange = (vals: DatePickerValue) => {
    // Check if the selected date range exceeds the plan limits
    const shouldShowUpgradePrompt = maybeShowUpgradePromptIfNotEntitled(
      vals.from,
      entitledToAuditLogDays
    )

    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
      return
    }

    const startDate = new Date(vals.from)
    const endDate = new Date(vals.to)
    column?.setFilterValue([startDate, endDate])
  }

  // Get current selected DatePickerValue based on the date range
  const getCurrentDatePickerValue = (): DatePickerValue => {
    if (!date?.from || !date?.to) {
      // Default to last 60 minutes
      const defaultHelper =
        REPORTS_DATEPICKER_HELPERS.find((h) => h.default) || REPORTS_DATEPICKER_HELPERS[0]
      return {
        from: defaultHelper.calcFrom(),
        to: defaultHelper.calcTo(),
        text: defaultHelper.text,
        isHelper: true,
      }
    }

    // Try to match with a helper
    const matchingHelper = REPORTS_DATEPICKER_HELPERS.find((helper) => {
      const helperFrom = new Date(helper.calcFrom())
      const helperTo = new Date(helper.calcTo())
      const timeDiff = 60000 // 1 minute tolerance

      return (
        Math.abs(date.from!.getTime() - helperFrom.getTime()) < timeDiff &&
        Math.abs(date.to!.getTime() - helperTo.getTime()) < timeDiff
      )
    })

    if (matchingHelper) {
      return {
        from: matchingHelper.calcFrom(),
        to: matchingHelper.calcTo(),
        text: matchingHelper.text,
        isHelper: true,
      }
    }

    // Custom range
    return {
      from: date.from.toISOString(),
      to: date.to.toISOString(),
      text: `${date.from.toLocaleDateString()} - ${date.to.toLocaleDateString()}`,
      isHelper: false,
    }
  }

  return (
    <>
      <LogsDatePicker
        buttonTriggerProps={{
          block: true,
          className: 'h-8',
        }}
        popoverContentProps={{
          // TS issue with radix props not propogating
          // @ts-expect-error
          side: 'bottom',
          align: 'start',
        }}
        onSubmit={handleDatePickerChange}
        value={getCurrentDatePickerValue()}
        helpers={REPORTS_DATEPICKER_HELPERS}
      />
      <UpgradePrompt
        show={showUpgradePrompt}
        setShowUpgradePrompt={setShowUpgradePrompt}
        title="Log date range"
        description="Log data can be retained for a maximum of 3 months depending on the plan that your project is on."
        source="unifiedLogsDateRange"
      />
    </>
  )
}

import type { CustomOptionProps } from 'ui-patterns/FilterBar'

import { AUDIT_LOG_DATEPICKER_HELPERS } from './AuditLogs.utils'
import {
  findMatchingDateHelper,
  formatDateRange,
} from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'
import {
  LogsDatePicker,
  type DatePickerValue,
} from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import {
  parseTimeRange,
  serializeTimeRange,
} from '@/components/interfaces/Settings/Logs/Logs.timeRange'

export const DateRangeOption = ({ onChange }: CustomOptionProps) => {
  const defaultHelper =
    AUDIT_LOG_DATEPICKER_HELPERS.find((helper) => helper.default) ?? AUDIT_LOG_DATEPICKER_HELPERS[0]
  return (
    <LogsDatePicker
      hideWarnings
      variant="inline"
      value={{
        from: defaultHelper.calcFrom(),
        to: defaultHelper.calcTo(),
        text: defaultHelper.text,
        isHelper: true,
      }}
      helpers={AUDIT_LOG_DATEPICKER_HELPERS}
      onSubmit={(value: DatePickerValue) =>
        onChange(serializeTimeRange([new Date(value.from), new Date(value.to)]))
      }
    />
  )
}

export const formatDateRangeValue = (value: unknown): string => {
  const range = parseTimeRange(value)
  if (!range) return String(value ?? '')
  const [from, to] = range
  const helper = findMatchingDateHelper(from, to, AUDIT_LOG_DATEPICKER_HELPERS)
  return helper?.text ?? formatDateRange(from.toISOString(), to.toISOString())
}

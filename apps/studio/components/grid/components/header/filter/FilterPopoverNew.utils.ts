import { format } from 'date-fns'

import type { SupaColumn } from 'components/grid/types'
import {
  isBoolColumn,
  isDateColumn,
  isDateTimeColumn,
  isEnumColumn,
  isTimeColumn,
} from 'components/grid/utils/types'
import type { FilterProperty } from 'ui-patterns'
import { FilterOperatorOptions } from './Filter.constants'

// Check if column is a date/datetime/time type
function isDateLikeColumn(column: SupaColumn): boolean {
  return (
    isDateColumn(column.format) || isDateTimeColumn(column.format) || isTimeColumn(column.format)
  )
}

const DEFAULT_OPERATORS = FilterOperatorOptions.map((op) => ({
  value: op.value,
  label: op.label,
}))

const STRING_OPERATORS = [
  { value: '~~*', label: 'ilike operator' },
  ...DEFAULT_OPERATORS.filter((op) => op.value !== '~~*'),
]

const DATE_OPERATORS = [
  { value: '>', label: 'greater than' },
  { value: '>=', label: 'greater than or equal' },
  { value: '<', label: 'less than' },
  { value: '<=', label: 'less than or equal' },
  { value: '=', label: 'equals' },
  { value: '<>', label: 'not equal' },
]

const BOOLEAN_OPERATORS = [
  { value: '=', label: 'equals' },
  { value: '<>', label: 'not equal' },
]

export function columnToFilterProperty(column: SupaColumn): FilterProperty {
  // For enum columns, use the enum values as options
  if (isEnumColumn(column.dataType) && column.enum) {
    return {
      label: column.name,
      name: column.name,
      type: 'string' as const,
      options: column.enum.map((value) => ({ label: value, value })),
      operators: DEFAULT_OPERATORS,
    }
  }

  // For boolean columns
  if (isBoolColumn(column.dataType)) {
    return {
      label: column.name,
      name: column.name,
      type: 'boolean' as const,
      options: [
        { label: 'true', value: 'true' },
        { label: 'false', value: 'false' },
      ],
      operators: BOOLEAN_OPERATORS,
    }
  }

  // For date/datetime columns
  if (isDateLikeColumn(column)) {
    const today = new Date()
    const yesterday = new Date(Date.now() - 86400000)
    const lastWeek = new Date(Date.now() - 7 * 86400000)
    const lastMonth = new Date(Date.now() - 30 * 86400000)

    return {
      label: column.name,
      name: column.name,
      type: 'date' as const,
      options: [
        { label: 'Today', value: format(today, 'yyyy-MM-dd') },
        { label: 'Yesterday', value: format(yesterday, 'yyyy-MM-dd') },
        { label: 'Last 7 days', value: format(lastWeek, 'yyyy-MM-dd') },
        { label: 'Last 30 days', value: format(lastMonth, 'yyyy-MM-dd') },
      ],
      operators: DATE_OPERATORS,
    }
  }

  // For other columns, keep a simple text-based filter
  return {
    label: column.name,
    name: column.name,
    type: 'string' as const,
    operators: STRING_OPERATORS,
  }
}

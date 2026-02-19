import type { SupaColumn } from 'components/grid/types'
import {
  isBoolColumn,
  isDateColumn,
  isDateTimeColumn,
  isEnumColumn,
  isTimeColumn,
} from 'components/grid/utils/types'
import { format } from 'date-fns'
import type { FilterProperty, OperatorDefinition } from 'ui-patterns'

// Check if column is a date/datetime/time type
function isDateLikeColumn(column: SupaColumn): boolean {
  return (
    isDateColumn(column.format) || isDateTimeColumn(column.format) || isTimeColumn(column.format)
  )
}

const COMPARISON_OPERATORS: OperatorDefinition[] = [
  { value: '=', label: 'Equals', group: 'comparison' },
  { value: '<>', label: 'Not equal', group: 'comparison' },
  { value: '>', label: 'Greater than', group: 'comparison' },
  { value: '<', label: 'Less than', group: 'comparison' },
  { value: '>=', label: 'Greater or equal', group: 'comparison' },
  { value: '<=', label: 'Less or equal', group: 'comparison' },
]

const PATTERN_OPERATORS: OperatorDefinition[] = [
  { value: '~~', label: 'Like', group: 'pattern' },
  { value: '~~*', label: 'iLike', group: 'pattern' },
]

const SET_NULL_OPERATORS: OperatorDefinition[] = [
  { value: 'in', label: 'In list', group: 'setNull' },
  { value: 'is', label: 'Is', group: 'setNull' },
]

const DEFAULT_OPERATORS: OperatorDefinition[] = [
  ...COMPARISON_OPERATORS,
  ...PATTERN_OPERATORS,
  ...SET_NULL_OPERATORS,
]

const STRING_OPERATORS: OperatorDefinition[] = DEFAULT_OPERATORS

const DATE_OPERATORS: OperatorDefinition[] = [
  { value: '>', label: 'Greater than', group: 'comparison' },
  { value: '>=', label: 'Greater or equal', group: 'comparison' },
  { value: '<', label: 'Less than', group: 'comparison' },
  { value: '<=', label: 'Less or equal', group: 'comparison' },
  { value: '=', label: 'Equals', group: 'comparison' },
  { value: '<>', label: 'Not equal', group: 'comparison' },
]

const BOOLEAN_OPERATORS: OperatorDefinition[] = [
  { value: '=', label: 'Equals', group: 'comparison' },
  { value: '<>', label: 'Not equal', group: 'comparison' },
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

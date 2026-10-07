import {
  type AsyncOptionsFunction,
  type CustomOptionObject,
  type FilterCondition,
  type FilterGroup,
  type FilterProperty,
} from 'ui-patterns/FilterBar'
import { z } from 'zod'

import {
  isLogsFilterColumnValue,
  type LogsColumnFilterValue,
  type LogsFilterOperator,
} from '../UnifiedLogs.filters'
import { REPORTS_DATEPICKER_HELPERS } from '@/components/interfaces/Reports/Reports.constants'
import {
  findMatchingDateHelper,
  formatDateRange,
} from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'
import type { Option } from '@/components/ui/DataTable/DataTable.types'

export const USER_PROPERTY = 'user'
export const TIME_RANGE_PROPERTY = 'date'

export type FilterableField = {
  label: string
  value: string
  type: string
  options?: Option[]
}

const filterOperatorSchema = z.object({
  label: z.string(),
  value: z.string(),
  group: z.string().optional(),
})

export const filterPropertySchema = z.object({
  label: z.string(),
  name: z.string(),
  type: z.enum(['string', 'number', 'date', 'boolean']),
  options: z
    .union([z.array(z.any()), z.function(), z.object({ component: z.function() })])
    .optional(),
  operators: z.array(filterOperatorSchema).optional(),
})

const COMPARISON_OPERATORS: FilterProperty['operators'] = [
  { label: 'Equals', value: '=', group: 'comparison' },
  { label: 'Not equal', value: '<>', group: 'comparison' },
]

const PATTERN_OPERATORS: FilterProperty['operators'] = [
  { label: 'iLike', value: '~~*', group: 'pattern' },
  { label: 'Not iLike', value: '!~~*', group: 'pattern' },
]

export const buildFilterProperties = ({
  fields,
  userOptions,
  timeRangeOptions,
}: {
  fields: FilterableField[]
  userOptions?: AsyncOptionsFunction
  timeRangeOptions?: CustomOptionObject
}): FilterProperty[] => {
  return [
    ...fields.map((field): FilterProperty => {
      if (field.type === 'timerange') {
        return {
          label: 'Time range',
          name: field.value,
          type: 'date',
          options: timeRangeOptions,
          formatValue: formatTimeRangeValue,
          operators: [{ label: 'Equals', value: '=', group: 'comparison' }],
        }
      }
      // event_message only supports substring matching (it's free text); pathname
      // supports both exact segment matching and substring matching.
      const operators =
        field.value === 'event_message'
          ? PATTERN_OPERATORS
          : field.value === 'pathname'
            ? [...COMPARISON_OPERATORS, ...PATTERN_OPERATORS]
            : COMPARISON_OPERATORS
      return {
        label: field.label,
        name: field.value,
        type: 'string',
        options: field.options ?? [],
        operators,
      }
    }),
    {
      label: 'User',
      name: USER_PROPERTY,
      type: 'string',
      options: userOptions ?? [],
      operators: [{ label: 'Equals', value: '=', group: 'comparison' }],
    },
  ]
}

export const getUserFilterValue = (conditions: FilterCondition[]): string | undefined => {
  const userCondition = conditions.find((condition) => condition.propertyName === USER_PROPERTY)
  return userCondition ? String(userCondition.value) : undefined
}

// Groups filter bar conditions by column into the wrapped `{ operator, values }` shape —
// the one shape every column filter value uses, matching logsFiltersToColumnFilters.
export const buildColumnFilterValues = (
  conditions: FilterCondition[]
): Map<string, LogsColumnFilterValue> => {
  const wrappedByColumn = new Map<string, LogsColumnFilterValue>()
  for (const condition of conditions) {
    if ([USER_PROPERTY, TIME_RANGE_PROPERTY].includes(condition.propertyName)) continue
    const operator = condition.operator as LogsFilterOperator
    const existing = wrappedByColumn.get(condition.propertyName)
    if (!existing) {
      wrappedByColumn.set(condition.propertyName, { operator, values: [String(condition.value)] })
    } else {
      existing.values.push(String(condition.value))
      // Mixed operators on the same column aren't expressible in the column-filter
      // shape (one operator per column). Last write wins.
      if (existing.operator !== operator) existing.operator = operator
    }
  }
  return wrappedByColumn
}

export const serializeTimeRange = (range: Date[]): string =>
  range.map((date) => date.toISOString()).join(' – ')

export const parseTimeRange = (value: unknown): [Date, Date] | undefined => {
  if (typeof value !== 'string') return
  const result = z.tuple([z.coerce.date(), z.coerce.date()]).safeParse(value.split(' – '))
  if (!result.success || result.data[0] > result.data[1]) return
  return result.data
}

export const buildFilterGroup = (
  columnFilters: { id: string; value: unknown }[],
  filterableNames: Set<string>
): FilterGroup => {
  const conditions: FilterCondition[] = []
  for (const { id, value } of columnFilters) {
    if (!filterableNames.has(id)) continue
    if (id === TIME_RANGE_PROPERTY) {
      const range = z.tuple([z.date(), z.date()]).safeParse(value)
      if (range.success) {
        conditions.push({ propertyName: id, value: serializeTimeRange(range.data), operator: '=' })
      }
      continue
    }
    if (!isLogsFilterColumnValue(value)) continue
    for (const v of value.values) {
      conditions.push({ propertyName: id, value: String(v), operator: value.operator })
    }
  }
  return { logicalOperator: 'AND', conditions }
}

export const formatTimeRangeValue = (value: FilterCondition['value']): string => {
  const range = parseTimeRange(value)
  if (!range) return String(value ?? '')
  const [from, to] = range
  const helper = findMatchingDateHelper(from, to, REPORTS_DATEPICKER_HELPERS)
  return helper?.text ?? formatDateRange(from.toISOString(), to.toISOString())
}

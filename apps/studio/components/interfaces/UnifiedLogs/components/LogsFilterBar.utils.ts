import {
  type AsyncOptionsFunction,
  type FilterCondition,
  type FilterProperty,
} from 'ui-patterns/FilterBar'
import { z } from 'zod'

import type { LogsColumnFilterValue, LogsFilterOperator } from '../UnifiedLogs.filters'
import type { Option } from '@/components/ui/DataTable/DataTable.types'

export const USER_PROPERTY = 'user'

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
  options: z.union([z.array(z.any()), z.function()]).optional(),
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
}: {
  fields: FilterableField[]
  userOptions?: AsyncOptionsFunction
}): FilterProperty[] => {
  return [
    ...fields
      .filter((field) => field.type !== 'timerange')
      .map((field): FilterProperty => {
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
    if (condition.propertyName === USER_PROPERTY) continue
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

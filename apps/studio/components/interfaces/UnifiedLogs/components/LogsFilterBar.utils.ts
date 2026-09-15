import {
  type AsyncOptionsFunction,
  type FilterCondition,
  type FilterProperty,
} from 'ui-patterns/FilterBar'
import { z } from 'zod'

import type { Option } from '@/components/ui/DataTable/DataTable.types'
import type { LogsColumnFilterValue, LogsFilterOperator } from '../UnifiedLogs.filters'

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
      .map(
        (field): FilterProperty => ({
          label: field.label,
          name: field.value,
          type: 'string',
          options: field.options ?? [],
          operators:
            field.value === 'event_message'
              ? [
                  { label: 'iLike', value: '~~*', group: 'pattern' },
                  { label: 'Not iLike', value: '!~~*', group: 'pattern' },
                ]
              : [
                  { label: 'Equals', value: '=', group: 'comparison' },
                  { label: 'Not equal', value: '<>', group: 'comparison' },
                ],
        })
      ),
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

// Groups filter bar conditions by column, then shapes each group the same way
// logsFiltersToColumnFilters does: `=` groups are bare string[] so sidebar checkboxes
// (which only understand that shape) render ticked; other operators stay wrapped so
// their operator survives the round trip.
export const buildColumnFilterValues = (
  conditions: FilterCondition[]
): Map<string, string[] | LogsColumnFilterValue> => {
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

  const result = new Map<string, string[] | LogsColumnFilterValue>()
  for (const [name, wrapped] of wrappedByColumn) {
    result.set(name, wrapped.operator === '=' ? wrapped.values : wrapped)
  }
  return result
}

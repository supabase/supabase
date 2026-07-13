import { type FilterCondition, type FilterProperty } from 'ui-patterns/FilterBar'
import { z } from 'zod'

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
  options: z.array(z.any()).optional(),
  operators: z.array(filterOperatorSchema).optional(),
})

export const buildFilterProperties = (filterFields: FilterableField[]): FilterProperty[] => {
  return [
    ...filterFields
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
      options: [],
      operators: [{ label: 'Equals', value: '=', group: 'comparison' }],
    },
  ]
}

export const getUserFilterValue = (conditions: FilterCondition[]): string | undefined => {
  const userCondition = conditions.find((condition) => condition.propertyName === USER_PROPERTY)
  return userCondition ? String(userCondition.value) : undefined
}

import {
  isGroup,
  type AsyncOptionsFunction,
  type CustomOptionObject,
  type FilterCondition,
  type FilterGroup,
  type FilterProperty,
} from 'ui-patterns/FilterBar'
import { z } from 'zod'

import { DEFAULT_LOG_TYPES, LOG_TYPE_TO_SOURCE } from '../UnifiedLogs.constants'
import {
  getLogAttributeKey,
  groupLogsFiltersByColumn,
  isLogsFilterColumnValue,
  isLogsFilterGroupColumnFilterId,
  isLogsFilterGroupValue,
  isLogsFilterOperator,
  parseLogsFilterUrlParams,
  TOP_LEVEL_ONLY_FILTER_COLUMNS,
  type LogsColumnFilterValue,
  type LogsFilter,
  type LogsFilterGroupValue,
  type LogsFilterOperator,
} from '../UnifiedLogs.filters'
import type { QuerySearchParamsType } from '../UnifiedLogs.types'
import { REPORTS_DATEPICKER_HELPERS } from '@/components/interfaces/Reports/Reports.constants'
import {
  findMatchingDateHelper,
  formatDateRange,
} from '@/components/interfaces/Settings/Logs/Logs.datePickerHelpers'
import {
  parseTimeRange,
  serializeTimeRange,
} from '@/components/interfaces/Settings/Logs/Logs.timeRange'
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

export const buildAttributeFilterProperty = (id: string): FilterProperty => ({
  label: getLogAttributeKey(id) ?? id,
  propertyGroupLabel: 'Attributes',
  name: id,
  type: 'string',
  operators: COMPARISON_OPERATORS,
})

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
          topLevelOnly: true,
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
        topLevelOnly: TOP_LEVEL_ONLY_FILTER_COLUMNS.includes(field.value),
      }
    }),
    {
      label: 'User',
      name: USER_PROPERTY,
      type: 'string',
      options: userOptions ?? [],
      operators: [{ label: 'Equals', value: '=', group: 'comparison' }],
      topLevelOnly: true,
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
  const groups: FilterGroup[] = columnFilters.flatMap(({ id, value }) =>
    isLogsFilterGroupColumnFilterId(id) && isLogsFilterGroupValue(value)
      ? [
          {
            logicalOperator: 'OR' as const,
            conditions: value.filters.map(({ column, operator, value }): FilterCondition => ({
              propertyName: column,
              operator,
              value,
            })),
          },
        ]
      : []
  )
  return { logicalOperator: 'AND', conditions: [...conditions, ...groups] }
}

export const collectFilterConditions = (group: FilterGroup): FilterCondition[] =>
  group.conditions.flatMap((condition) =>
    isGroup(condition) ? collectFilterConditions(condition) : [condition]
  )

export interface NormalizedFilterGroup {
  conditions: FilterCondition[]
  groups: LogsFilterGroupValue[]
}

const toLogsFilter = (condition: FilterCondition): LogsFilter | undefined => {
  const operator = String(condition.operator)
  if (!isLogsFilterOperator(operator)) return undefined
  if (!condition.propertyName || condition.value === null || condition.value === '')
    return undefined
  if (TOP_LEVEL_ONLY_FILTER_COLUMNS.includes(condition.propertyName)) return undefined
  return { column: condition.propertyName, operator, value: String(condition.value) }
}

/**
 * Reduces the filter bar tree to what Unified Logs can express: top-level conditions ANDed
 * together plus any number of OR groups. Nested AND groups merge into the root and nested OR
 * groups inside an OR group merge into it. Empty groups are skipped. Returns null while anything
 * is incomplete (missing value) or can't be expressed (an AND group inside an OR group), so the caller
 * leaves the applied filters untouched. The same goes for a column used with different
 * operators at the root.
 */
export const normalizeFilterGroup = (root: FilterGroup): NormalizedFilterGroup | null => {
  if (root.logicalOperator !== 'AND') return null

  const conditions: FilterCondition[] = []
  const groups: LogsFilterGroupValue[] = []

  const collectOrFilters = (group: FilterGroup): LogsFilter[] | null => {
    if (group.logicalOperator !== 'OR') return null
    const filters: LogsFilter[] = []
    for (const child of group.conditions) {
      if (isGroup(child)) {
        const nested = collectOrFilters(child)
        if (!nested) return null
        filters.push(...nested)
        continue
      }
      const filter = toLogsFilter(child)
      if (!filter) return null
      filters.push(filter)
    }
    return filters
  }

  const collectRoot = (group: FilterGroup): boolean => {
    for (const child of group.conditions) {
      if (!isGroup(child)) {
        if (!child.propertyName || !child.operator || child.value === null || child.value === '') {
          return false
        }
        conditions.push(child)
        continue
      }
      if (child.logicalOperator === 'AND') {
        if (!collectRoot(child)) return false
        continue
      }
      const filters = collectOrFilters(child)
      if (!filters) return false
      // An empty group constrains nothing, so a group emptied by removing its last condition
      // stops filtering instead of leaving the old group applied.
      if (filters.length === 0) continue
      groups.push({ group: 'or', filters })
    }
    return true
  }

  if (!collectRoot(root)) return null

  // The column-filter shape holds one operator per column, so `status <> 200 AND status = 500`
  // can't be stored without one operator silently replacing the other.
  const operatorByColumn = new Map<string, FilterCondition['operator']>()
  for (const { propertyName, operator } of conditions) {
    const existing = operatorByColumn.get(propertyName)
    if (existing !== undefined && existing !== operator) return null
    operatorByColumn.set(propertyName, operator)
  }

  return { conditions, groups }
}

export const formatTimeRangeValue = (value: FilterCondition['value']): string => {
  const range = parseTimeRange(value)
  if (!range) return String(value ?? '')
  const [from, to] = range
  const helper = findMatchingDateHelper(from, to, REPORTS_DATEPICKER_HELPERS)
  return helper?.text ?? formatDateRange(from.toISOString(), to.toISOString())
}

export const getLogAttributeSources = (search: QuerySearchParamsType): string[] => {
  const filter = groupLogsFiltersByColumn(parseLogsFilterUrlParams(search.filter)).log_type
  const hasUser = !!search.user?.trim()
  const hasDefaultSources = !filter && !search.scope && !hasUser
  let types = Object.keys(LOG_TYPE_TO_SOURCE)
  if (hasDefaultSources) types = [...DEFAULT_LOG_TYPES]
  if (filter?.operator === '=') types = types.filter((type) => filter.values.includes(type))
  if (filter?.operator === '<>') {
    types = types.filter(
      (type) =>
        !filter.values.includes(type) && (!!search.scope || type !== 'edge function runtime')
    )
  }
  const scopeTypes = search.scope?.filters.filter(({ column }) => column === 'log_type') ?? []
  const includedScopeTypes = scopeTypes.filter(({ operator }) => operator === '=')
  const excludedScopeTypes = scopeTypes.filter(({ operator }) => operator === '<>')
  if (includedScopeTypes.length > 0) {
    types = types.filter((type) => includedScopeTypes.some(({ value }) => value === type))
  }
  types = types.filter((type) => !excludedScopeTypes.some(({ value }) => value === type))
  if (hasUser) types = types.filter((type) => type === 'edge' || type === 'auth')
  return Object.entries(LOG_TYPE_TO_SOURCE)
    .filter(([type]) => types.includes(type))
    .map(([, source]) => source)
}

const conditionKey = ({ propertyName, operator, value }: FilterCondition) =>
  JSON.stringify([propertyName, operator, String(value)])

const filterKey = ({ column, operator, value }: LogsFilter) =>
  JSON.stringify([column, operator, value])

const getFilterSignature = (group: FilterGroup): string | null => {
  const normalized = normalizeFilterGroup(group)
  if (!normalized) return null
  return JSON.stringify({
    conditions: normalized.conditions.map(conditionKey).sort(),
    groups: normalized.groups.map(({ filters }) => filters.map(filterKey).sort().join()).sort(),
  })
}

/**
 * Whether two filter bar trees apply the same filters once reduced to what Unified Logs can
 * express. Lets the bar keep a nested AND group the user is editing (which merges into the
 * root when applied) instead of rebuilding it from the applied filters.
 */
export const areFilterGroupsEquivalent = (a: FilterGroup, b: FilterGroup): boolean => {
  const signature = getFilterSignature(a)
  return signature !== null && signature === getFilterSignature(b)
}

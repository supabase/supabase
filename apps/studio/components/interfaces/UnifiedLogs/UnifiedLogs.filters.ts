import type { Table } from '@tanstack/react-table'

// Operators mirror PostgREST / Table Editor conventions:
//   `=` / `<>` — exact equality, available on most columns
//   `~~*` / `!~~*` — ILIKE / NOT ILIKE (case-insensitive substring
//                    contains / does-not-contain), wired up only for the
//                    `event_message` column
export type LogsFilterOperator = '=' | '<>' | '~~*' | '!~~*'

export interface LogsFilter {
  column: string
  operator: LogsFilterOperator
  value: string
}

export interface LogsColumnFilterValue {
  operator: LogsFilterOperator
  values: string[]
}

const OPERATOR_TO_ABBREV: Record<LogsFilterOperator, string> = {
  '=': 'eq',
  '<>': 'neq',
  '~~*': 'ilike',
  '!~~*': 'notilike',
}

const ABBREV_TO_OPERATOR: Record<string, LogsFilterOperator> = {
  eq: '=',
  neq: '<>',
  ilike: '~~*',
  notilike: '!~~*',
}

export const isLogsFilterOperator = (value: string): value is LogsFilterOperator =>
  Object.hasOwn(OPERATOR_TO_ABBREV, value)

export const logAttributeFilterId = (key: string) => `attribute.${key}`

export const getLogAttributeKey = (id: string): string | undefined =>
  id.startsWith('attribute.') ? id.slice('attribute.'.length) : undefined

export const isLogsFilterColumnValue = (value: unknown): value is LogsColumnFilterValue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'operator' in value &&
    'values' in value &&
    Array.isArray((value as LogsColumnFilterValue).values)
  )
}

// A group is an OR of conditions that sits inside the root AND, e.g.
// `status <> 200 OR pathname <> /health` — the De Morgan form of
// `NOT (status = 200 AND pathname = /health)`.
//
// In the URL a group is one `filter` entry: `group:or:<column>:<op>:<value>,…` with each
// column and value URI-encoded. The `or` slot is never a valid operator abbreviation, so
// `parseLogsFilterUrlParams` skips group entries and older clients ignore them.
export interface LogsFilterGroup {
  operator: 'or'
  filters: LogsFilter[]
}

export interface LogsFilterGroupValue {
  group: 'or'
  filters: LogsFilter[]
}

const GROUP_URL_PREFIX = 'group:or:'
const GROUP_COLUMN_FILTER_PREFIX = 'group.'
const GROUP_COLUMN_FILTER_ID_PATTERN = /^group\.\d+$/

// Columns whose filters change which sources are queried or are handled outside the filter
// SQL, so they only make sense at the top level.
export const TOP_LEVEL_ONLY_FILTER_COLUMNS: readonly string[] = [
  'log_type',
  'pipeline_id',
  'date',
  'user',
]

export const logsFilterGroupColumnFilterId = (index: number) =>
  `${GROUP_COLUMN_FILTER_PREFIX}${index}`

export const isLogsFilterGroupColumnFilterId = (id: string) =>
  GROUP_COLUMN_FILTER_ID_PATTERN.test(id)

export const isLogsFilterGroupValue = (value: unknown): value is LogsFilterGroupValue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'group' in value &&
    value.group === 'or' &&
    'filters' in value &&
    Array.isArray(value.filters)
  )
}

export interface LogsFilterInput {
  field: string
  operator: LogsFilterOperator
  value: string | number
}

export const EQUALITY_FILTER_OPERATORS = ['=', '<>'] as const satisfies LogsFilterOperator[]

export const LOGS_FILTER_OPERATOR_LABELS: Record<LogsFilterOperator, string> = {
  '=': 'Filter: equals',
  '<>': 'Filter: not equals',
  '~~*': 'Filter: contains',
  '!~~*': 'Filter: does not contain',
}

export const LOGS_FILTER_OPERATOR_VERBS: Record<LogsFilterOperator, string> = {
  '=': 'equals',
  '<>': 'does not equal',
  '~~*': 'contains',
  '!~~*': 'does not contain',
}

export const addLogsColumnFilter = (
  columnFilters: { id: string; value: unknown }[],
  { field, operator, value }: LogsFilterInput
): { id: string; value: unknown }[] => {
  const stringValue = String(value)
  const index = columnFilters.findIndex((filter) => filter.id === field)
  const current = index === -1 ? undefined : columnFilters[index].value
  const existing = isLogsFilterColumnValue(current) ? current : undefined
  const matchesOperator = existing?.operator === operator
  if (matchesOperator && existing.values.includes(stringValue)) return columnFilters
  const next: LogsColumnFilterValue = {
    operator,
    values: matchesOperator ? [...existing.values, stringValue] : [stringValue],
  }
  if (index === -1) return [...columnFilters, { id: field, value: next }]
  return columnFilters.map((filter, i) => (i === index ? { id: field, value: next } : filter))
}

export const addLogsFilter = <TData>(table: Table<TData>, filter: LogsFilterInput) =>
  table.setColumnFilters((current) => addLogsColumnFilter(current, filter))

export const parseLogsFilterUrlParams = (filter?: string[] | null): LogsFilter[] => {
  if (!Array.isArray(filter)) return []
  return filter.flatMap((raw): LogsFilter[] => {
    const [column, abbrev, ...rest] = raw.split(':')
    const operator = Object.hasOwn(ABBREV_TO_OPERATOR, abbrev)
      ? ABBREV_TO_OPERATOR[abbrev]
      : undefined
    if (!column || !operator) return []
    const value = rest.join(':')
    if (!column.startsWith('attribute.')) return [{ column, operator, value }]
    try {
      return [{ column: decodeURIComponent(column), operator, value: decodeURIComponent(value) }]
    } catch {
      return []
    }
  })
}

/** Counts flat filters and OR groups, so a view holding only a group still counts as filtered. */
export const countLogsFilterUrlParams = (filter?: string[] | null): number =>
  parseLogsFilterUrlParams(filter).length + parseLogsFilterGroupUrlParams(filter).length

export const logsFiltersToUrlParams = (filters: LogsFilter[]): string[] => {
  return filters.map((filter) => {
    const isAttributeFilter = filter.column.startsWith('attribute.')
    const column = isAttributeFilter ? encodeURIComponent(filter.column) : filter.column
    const value = isAttributeFilter ? encodeURIComponent(filter.value) : filter.value
    return `${column}:${OPERATOR_TO_ABBREV[filter.operator]}:${value}`
  })
}

export const logsFilterGroupsToUrlParams = (groups: LogsFilterGroup[]): string[] => {
  return groups
    .filter((group) => group.filters.length > 0)
    .map(
      (group) =>
        GROUP_URL_PREFIX +
        group.filters
          .map(
            ({ column, operator, value }) =>
              `${encodeURIComponent(column)}:${OPERATOR_TO_ABBREV[operator]}:${encodeURIComponent(value)}`
          )
          .join(',')
    )
}

const parseLogsFilterGroup = (raw: string): LogsFilterGroup | undefined => {
  if (!raw.startsWith(GROUP_URL_PREFIX)) return undefined
  const filters: LogsFilter[] = []
  for (const part of raw.slice(GROUP_URL_PREFIX.length).split(',')) {
    const [encodedColumn, abbrev, encodedValue, ...rest] = part.split(':')
    const operator = Object.hasOwn(ABBREV_TO_OPERATOR, abbrev)
      ? ABBREV_TO_OPERATOR[abbrev]
      : undefined
    if (!encodedColumn || !operator || encodedValue === undefined || rest.length > 0) {
      return undefined
    }
    try {
      const column = decodeURIComponent(encodedColumn)
      if (TOP_LEVEL_ONLY_FILTER_COLUMNS.includes(column)) return undefined
      filters.push({ column, operator, value: decodeURIComponent(encodedValue) })
    } catch {
      return undefined
    }
  }
  // A group with any unreadable condition is dropped whole: dropping just that condition
  // would silently narrow an OR.
  return filters.length > 0 ? { operator: 'or', filters } : undefined
}

export const parseLogsFilterGroupUrlParams = (filter?: string[] | null): LogsFilterGroup[] => {
  if (!Array.isArray(filter)) return []
  return filter.flatMap((raw) => {
    const group = parseLogsFilterGroup(raw)
    return group ? [group] : []
  })
}

export const groupLogsFiltersByColumn = (
  filters: LogsFilter[]
): Record<string, LogsColumnFilterValue> => {
  const grouped: Record<string, LogsColumnFilterValue> = Object.create(null)
  for (const { column, operator, value } of filters) {
    const existing = grouped[column]
    if (!existing) {
      grouped[column] = { operator, values: [value] }
    } else {
      existing.values.push(value)
      // Mixed operators on the same column aren't expressible in the column-filter
      // shape (one operator per column). Last write wins.
      if (existing.operator !== operator) existing.operator = operator
    }
  }
  return grouped
}

export const logsFiltersToColumnFilters = (
  filters: LogsFilter[]
): { id: string; value: LogsColumnFilterValue }[] => {
  return Object.entries(groupLogsFiltersByColumn(filters)).map(([id, group]) => ({
    id,
    value: group,
  }))
}

// Seeds `date` too, so `logsFiltersToColumnFilters` (which only covers the `filter`
// param) doesn't leave it out and get nulled by the debounced sync back to `search`.
export const buildDefaultColumnFilters = (search: {
  filter?: string[] | null
  date?: Date[] | null
}): { id: string; value: unknown }[] => {
  const filters: { id: string; value: unknown }[] = logsFiltersToColumnFilters(
    parseLogsFilterUrlParams(search.filter)
  ).filter((f) => f.id !== 'date')
  parseLogsFilterGroupUrlParams(search.filter).forEach((group, index) => {
    filters.push({
      id: logsFilterGroupColumnFilterId(index),
      value: { group: group.operator, filters: group.filters } satisfies LogsFilterGroupValue,
    })
  })
  if (search.date?.length === 2) filters.push({ id: 'date', value: search.date })
  return filters
}

export const columnFiltersToLogsFilters = (
  columnFilters: { id: string; value: unknown }[],
  filterableNames?: Set<string>
): LogsFilter[] => {
  const filters: LogsFilter[] = []
  for (const { id, value } of columnFilters) {
    if (filterableNames && !filterableNames.has(id)) continue
    if (value === null || value === undefined) continue
    if (isLogsFilterGroupValue(value)) continue
    const fallback: LogsColumnFilterValue = {
      operator: '=',
      values: (Array.isArray(value) ? value : [value]).map(String),
    }
    const { operator, values } = isLogsFilterColumnValue(value) ? value : fallback
    for (const v of values) {
      filters.push({ column: id, operator, value: v })
    }
  }
  return filters
}

export const buildFilterSearchUpdate = (
  columnFilters: { id: string; value: unknown }[],
  filterFields: { value: string; type: string }[]
): Record<string, unknown> => {
  const timerangeNames = new Set(
    filterFields.filter((field) => field.type === 'timerange').map((field) => field.value)
  )
  const filterEntries = [
    ...logsFiltersToUrlParams(
      columnFiltersToLogsFilters(columnFilters.filter(({ id }) => !timerangeNames.has(id)))
    ),
    ...logsFilterGroupsToUrlParams(
      columnFilters.flatMap(({ value }) =>
        isLogsFilterGroupValue(value) ? [{ operator: value.group, filters: value.filters }] : []
      )
    ),
  ]
  const update: Record<string, unknown> = {
    filter: filterEntries.length > 0 ? filterEntries : null,
  }
  for (const field of filterFields) {
    if (field.type !== 'timerange') continue
    const current = columnFilters.find((c) => c.id === field.value)?.value
    update[field.value] = current ?? null
  }
  return update
}

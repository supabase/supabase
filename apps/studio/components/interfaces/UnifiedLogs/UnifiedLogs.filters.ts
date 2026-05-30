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

export const LOGS_FILTER_OPERATORS = [
  '=',
  '<>',
  '~~*',
  '!~~*',
] as const satisfies readonly LogsFilterOperator[]

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

export const isLogsFilterColumnValue = (value: unknown): value is LogsColumnFilterValue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'operator' in value &&
    'values' in value &&
    Array.isArray((value as LogsColumnFilterValue).values)
  )
}

export const parseLogsFilterUrlParams = (filter?: string[] | null): LogsFilter[] => {
  if (!Array.isArray(filter)) return []
  const parsed: LogsFilter[] = []
  for (const raw of filter) {
    const [column, abbrev, ...rest] = raw.split(':')
    const operator = ABBREV_TO_OPERATOR[abbrev]
    if (!column || !operator) continue
    parsed.push({ column, operator, value: rest.join(':') })
  }
  return parsed
}

export const logsFiltersToUrlParams = (filters: LogsFilter[]): string[] => {
  return filters.map((f) => `${f.column}:${OPERATOR_TO_ABBREV[f.operator]}:${f.value}`)
}

export const groupLogsFiltersByColumn = (
  filters: LogsFilter[]
): Record<string, LogsColumnFilterValue> => {
  const grouped: Record<string, LogsColumnFilterValue> = {}
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

export const columnFiltersToLogsFilters = (
  columnFilters: { id: string; value: unknown }[]
): LogsFilter[] => {
  const filters: LogsFilter[] = []
  for (const { id, value } of columnFilters) {
    if (!isLogsFilterColumnValue(value)) continue
    for (const v of value.values) {
      filters.push({ column: id, operator: value.operator, value: String(v) })
    }
  }
  return filters
}

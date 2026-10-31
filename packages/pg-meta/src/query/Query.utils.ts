import {
  format,
  ident,
  joinSqlFragments,
  literal,
  safeSql,
  type SafeSqlFragment,
} from '../pg-format'
import type { Dictionary, Filter, QueryPagination, QueryTable, Sort } from './types'

export function countQuery(
  table: QueryTable,
  options?: {
    filters?: Filter[]
  }
) {
  let query = safeSql`select count(*) from ${queryTable(table)}`
  const { filters } = options ?? {}
  if (filters) {
    query = applyFilters(query, filters)
  }
  return safeSql`${query};`
}

export function truncateQuery(
  table: QueryTable,
  options?: {
    // [Joshen] yet to implement cascade from UI, just adding first
    cascade?: boolean
  }
) {
  let query = safeSql`truncate ${queryTable(table)}`
  const { cascade } = options ?? {}
  if (cascade) {
    query = safeSql`${query} cascade`
  }
  return safeSql`${query};`
}

export function deleteQuery(
  table: QueryTable,
  filters?: Filter[],
  options?: {
    returning?: boolean
    enumArrayColumns?: string[]
  }
) {
  if (!filters || filters.length === 0) {
    throw new Error('no filters for this delete query')
  }
  let query = safeSql`delete from ${queryTable(table)}`
  const { returning, enumArrayColumns } = options ?? {}
  if (filters) {
    query = applyFilters(query, filters)
  }
  if (returning) {
    const returningFragment =
      enumArrayColumns === undefined || enumArrayColumns.length === 0
        ? safeSql` returning *`
        : safeSql` returning *, ${joinSqlFragments(
            enumArrayColumns.map((x) => safeSql`${ident(x)}::text[]`),
            ','
          )}`
    query = safeSql`${query}${returningFragment}`
  }
  return safeSql`${query};`
}

export function insertQuery(
  table: QueryTable,
  values: Dictionary<any>[],
  options?: {
    returning?: boolean
    enumArrayColumns?: string[]
  }
) {
  if (!values || values.length === 0) {
    throw new Error('no value to insert')
  }
  const { returning, enumArrayColumns } = options ?? {}
  const queryColumns = joinSqlFragments(
    Object.keys(values[0]).map((x) => ident(x)),
    ','
  )
  let query = safeSql``
  if (queryColumns.length == 0) {
    query = format(
      safeSql`insert into %1$s select from jsonb_populate_recordset(null::%1$s, %2$s)`,
      queryTable(table),
      literal(JSON.stringify(values))
    )
  } else {
    query = format(
      safeSql`insert into %1$s (%2$s) select %2$s from jsonb_populate_recordset(null::%1$s, %3$s)`,
      queryTable(table),
      queryColumns,
      literal(JSON.stringify(values))
    )
  }
  if (returning) {
    const returningStatement =
      enumArrayColumns === undefined || enumArrayColumns.length === 0
        ? safeSql` returning *`
        : safeSql` returning *, ${joinSqlFragments(
            enumArrayColumns.map((x) => safeSql`${ident(x)}::text[]`),
            ','
          )}`
    query = safeSql`${query}${returningStatement}`
  }
  return safeSql`${query};`
}

export function selectQuery(
  table: QueryTable,
  columns?: SafeSqlFragment,
  options?: {
    filters?: Filter[]
    pagination?: QueryPagination
    sorts?: Sort[]
  },
  isFinal = true,
  isCTE = false
) {
  let query = safeSql``
  const queryColumn = columns ?? safeSql`*`
  query = safeSql`select ${queryColumn} from ${isCTE ? queryCTE(table) : queryTable(table)}`

  const { filters, pagination, sorts } = options ?? {}
  if (filters) {
    query = applyFilters(query, filters)
  }
  if (sorts) {
    query = applySorts(query, sorts)
  }
  if (pagination) {
    const { limit, offset } = pagination ?? {}
    query = safeSql`${query} limit ${literal(limit)} offset ${literal(offset)}`
  }
  return safeSql`${query}${isFinal ? safeSql`;` : safeSql``}`
}

export function updateQuery(
  table: QueryTable,
  value: Dictionary<any>,
  options?: {
    filters?: Filter[]
    returning?: boolean
    enumArrayColumns?: string[]
  }
) {
  const { filters, returning, enumArrayColumns } = options ?? {}
  if (!filters || filters.length === 0) {
    throw new Error('no filters for this update query')
  }
  const queryColumns = joinSqlFragments(
    Object.keys(value).map((x) => ident(x)),
    ','
  )
  let query = format(
    safeSql`update %1$s set (%2$s) = (select %2$s from json_populate_record(null::%1$s, %3$s))`,
    queryTable(table),
    queryColumns,
    literal(JSON.stringify(value))
  )
  if (filters) {
    query = applyFilters(query, filters)
  }
  if (returning) {
    const returning =
      enumArrayColumns === undefined || enumArrayColumns.length === 0
        ? safeSql` returning *`
        : safeSql` returning *, ${joinSqlFragments(
            enumArrayColumns.map((x) => safeSql`${ident(x)}::text[]`),
            ','
          )}`
    query = safeSql`${query}${returning}`
  }

  return safeSql`${query};`
}

//============================================================
// Filter Utils
//============================================================

function applyFilters(query: SafeSqlFragment, filters: Filter[]) {
  if (filters.length === 0) return query
  query = safeSql`${query} where ${joinSqlFragments(
    filters.map((filter) => {
      // Handle composite values
      if (Array.isArray(filter.column)) {
        switch (filter.operator) {
          case 'in':
            return inTupleFilterSql(filter)
          case '=':
          case '<>':
          case '>':
          case '<':
          case '>=':
          case '<=':
            return defaultTupleFilterSql(filter)
          default:
            throw new Error(`Cannot use ${filter.operator} operator in a tuple filter`)
        }
      }

      switch (filter.operator) {
        case 'in':
          return inFilterSql(filter)
        case 'is':
          return isFilterSql(filter)
        case '~~':
        case '~~*':
        case '!~~':
        case '!~~*':
          return castColumnToText(filter)
        default:
          return safeSql`${ident(filter.column)} ${filter.operator as SafeSqlFragment} ${filterLiteral(filter.value)}`
      }
    }),
    ' and '
  )}`
  return query
}

function inFilterSql(filter: Filter) {
  let values: Array<SafeSqlFragment>
  if (Array.isArray(filter.value)) {
    values = filter.value.map((x) => filterLiteral(x))
  } else {
    const filterValueTxt = String(filter.value)
    values = filterValueTxt.split(',').map((x) => filterLiteral(x))
  }
  return safeSql`${ident(filter.column)} ${filter.operator as SafeSqlFragment} (${joinSqlFragments(values, ',')})`
}

function defaultTupleFilterSql(filter: Filter) {
  if (!Array.isArray(filter.column)) {
    throw new Error('Use standard applyFilters for single column')
  }
  if (!Array.isArray(filter.value)) {
    throw new Error('Tuple filter value must be an array')
  }
  if (filter.value.length !== filter.column.length) {
    throw new Error('Tuple filter value must have the same length as the column array')
  }

  const columns = safeSql`(${joinSqlFragments(
    filter.column.map((c) => ident(c)),
    ', '
  )})`
  const values = safeSql`(${joinSqlFragments(
    filter.value.map((v) => filterLiteral(v)),
    ', '
  )})`
  return safeSql`${columns} ${filter.operator as SafeSqlFragment} ${values}`
}

function inTupleFilterSql(filter: Filter) {
  if (!Array.isArray(filter.column)) {
    throw new Error('Use inFilterSql for single columns')
  }
  if (!Array.isArray(filter.value)) {
    throw new Error(`Values for a tuple 'in' filter must be an array`)
  }

  const columns = safeSql`(${joinSqlFragments(
    filter.column.map((c) => ident(c)),
    ', '
  )})`

  const values = filter.value.map((v) => {
    if (Array.isArray(v)) {
      if (v.length !== filter.column.length) {
        throw new Error(`Tuple value length must match column length`)
      }
      return safeSql`(${joinSqlFragments(
        v.map((x) => filterLiteral(x)),
        ', '
      )})`
    } else {
      const filterValueTxt = String(v)
      const currValues = filterValueTxt.split(',')
      if (currValues.length !== filter.column.length) {
        throw new Error(`Tuple value length must match column length`)
      }
      return safeSql`(${joinSqlFragments(
        currValues.map((x) => filterLiteral(x)),
        ', '
      )})`
    }
  })

  return safeSql`${columns} ${filter.operator as SafeSqlFragment} (${joinSqlFragments(values, ', ')})`
}

function isFilterSql(filter: Filter) {
  const filterValueTxt = String(filter.value)
  switch (filterValueTxt) {
    case 'null':
    case 'false':
    case 'true':
    case 'not null':
      return safeSql`${ident(filter.column)} ${filter.operator as SafeSqlFragment} ${filterValueTxt as SafeSqlFragment}`
    default:
      return safeSql`${ident(filter.column)} ${filter.operator as SafeSqlFragment} ${filterLiteral(filter.value)}`
  }
}

function castColumnToText(filter: Filter) {
  return safeSql`${ident(filter.column)}::text ${filter.operator as SafeSqlFragment} ${filterLiteral(filter.value)}`
}

function parseArrayLiteral(value: string): SafeSqlFragment | null {
  if (!value.startsWith('ARRAY[')) return null

  // Find the closing ] of the ARRAY, tracking quoted strings
  const afterPrefix = value.slice(6)
  let inString = false
  let arrayCloseIdx = -1
  for (let i = 0; i < afterPrefix.length; i++) {
    const ch = afterPrefix[i]
    if (!inString) {
      if (ch === ']') {
        arrayCloseIdx = i
        break
      } else if (ch === "'") {
        inString = true
      }
    } else {
      if (ch === "'" && afterPrefix[i + 1] === "'") {
        i++ // escaped ''
      } else if (ch === "'") {
        inString = false
      }
    }
  }
  if (arrayCloseIdx === -1) return null

  const contents = afterPrefix.slice(0, arrayCloseIdx)
  const suffix = afterPrefix.slice(arrayCloseIdx + 1) // e.g. "::status_type[]" or ""

  // Validate type cast suffix: only allow ::word_chars[]? or empty
  let typeCast: SafeSqlFragment = safeSql``
  if (suffix !== '') {
    const match = suffix.match(/^::([A-Za-z_][A-Za-z0-9_]*)(\[\])?$/)
    if (!match) return null
    typeCast = safeSql`::${match[1] as SafeSqlFragment}${match[2] ? safeSql`[]` : safeSql``}`
  }

  // Parse comma-separated, single-quoted items
  const rawItems: Array<string> = []
  let current = ''
  let inStr = false
  for (let i = 0; i < contents.length; i++) {
    const ch = contents[i]
    if (!inStr) {
      if (ch === "'") {
        inStr = true
        current += ch
      } else if (ch === ',') {
        rawItems.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    } else {
      if (ch === "'" && contents[i + 1] === "'") {
        current += "''"
        i++
      } else if (ch === "'") {
        current += ch
        inStr = false
      } else {
        current += ch
      }
    }
  }
  if (current.trim()) rawItems.push(current.trim())

  const unquoted = rawItems.map((item) => {
    if (item.startsWith("'") && item.endsWith("'")) {
      return item.slice(1, -1).replace(/''/g, "'")
    }
    return item
  })

  const formattedItems = joinSqlFragments(
    unquoted.map((x) => literal(x)),
    ','
  )
  return safeSql`ARRAY[${formattedItems}]${typeCast}`
}

function filterLiteral(value: any): SafeSqlFragment {
  if (typeof value === 'boolean') {
    return (value ? 'true' : 'false') as SafeSqlFragment
  }
  if (typeof value === 'string') {
    if (value.startsWith('ARRAY[')) {
      const parsed = parseArrayLiteral(value)
      if (parsed !== null) return parsed
    }
    return literal(value)
  }
  return literal(value)
}

//============================================================
// Sort Utils
//============================================================

function applySorts(query: SafeSqlFragment, sorts: Sort[]): SafeSqlFragment {
  const validSorts = sorts.filter((sort) => sort.column)
  if (validSorts.length === 0) return query
  query = safeSql`${query} order by ${joinSqlFragments(
    validSorts.map((x) => {
      const order = x.ascending ? safeSql`asc` : safeSql`desc`
      const nullOrder = x.nullsFirst ? safeSql`nulls first` : safeSql`nulls last`
      return safeSql`${ident(x.table)}.${ident(x.column)} ${order} ${nullOrder}`
    }),
    ', '
  )}`
  return query
}

//============================================================
// Misc
//============================================================

function queryTable(table: QueryTable) {
  return safeSql`${ident(table.schema)}.${ident(table.name)}`
}

function queryCTE(table: QueryTable) {
  return safeSql`${ident(table.name)}`
}

export function wrapWithTransaction(sql: SafeSqlFragment) {
  return safeSql`
    begin;

    ${sql}

    commit;
  `
}

export function wrapWithRollback(sql: SafeSqlFragment) {
  return safeSql`
    begin;

    ${sql}

    rollback;
  `
}

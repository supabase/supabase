import { format, ident, literal } from '@supabase/pg-meta/src/pg-format'
import type { Dictionary } from 'types'
import type { Filter, QueryPagination, QueryTable, Sort } from '../types'

export function countQuery(
  table: QueryTable,
  options?: {
    filters?: Filter[]
  }
) {
  let query = `select count(*) from ${queryTable(table)}`
  const { filters } = options ?? {}
  if (filters) {
    query = applyFilters(query, filters)
  }
  return query + ';'
}

export function truncateQuery(
  table: QueryTable,
  options?: {
    // [Joshen] yet to implement cascade from UI, just adding first
    cascade?: boolean
  }
) {
  let query = `truncate ${queryTable(table)}`
  const { cascade } = options ?? {}
  if (cascade) {
    query += ' cascade'
  }
  return query + ';'
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
    throw { message: 'no filters for this delete query' }
  }
  let query = `delete from ${queryTable(table)}`
  const { returning, enumArrayColumns } = options ?? {}
  if (filters) {
    query = applyFilters(query, filters)
  }
  if (returning) {
    query +=
      enumArrayColumns === undefined || enumArrayColumns.length === 0
        ? ` returning *`
        : ` returning *, ${enumArrayColumns.map((x) => `"${x}"::text[]`).join(',')}`
  }
  return query + ';'
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
    throw { message: 'no value to insert' }
  }
  const { returning, enumArrayColumns } = options ?? {}
  const queryColumns = Object.keys(values[0])
    .map((x) => ident(x))
    .join(',')
  let query = ''
  if (queryColumns.length == 0) {
    query = format(
      'insert into %1$s select from jsonb_populate_recordset(null::%1$s, %2$s)',
      queryTable(table),
      literal(JSON.stringify(values))
    )
  } else {
    query = format(
      'insert into %1$s (%2$s) select %2$s from jsonb_populate_recordset(null::%1$s, %3$s)',
      queryTable(table),
      queryColumns,
      literal(JSON.stringify(values))
    )
  }
  if (returning) {
    query +=
      enumArrayColumns === undefined || enumArrayColumns.length === 0
        ? ` returning *`
        : ` returning *, ${enumArrayColumns.map((x) => `"${x}"::text[]`).join(',')}`
  }
  return query + ';'
}

export function selectQuery(
  table: QueryTable,
  columns?: string,
  options?: {
    filters?: Filter[]
    pagination?: QueryPagination
    sorts?: Sort[]
  }
) {
  let query = ''
  const queryColumn = columns ?? '*'
  query += `select ${queryColumn} from ${queryTable(table)}`

  const { filters, pagination, sorts } = options ?? {}
  if (filters) {
    query = applyFilters(query, filters)
  }
  if (sorts) {
    query = applySorts(query, sorts)
  }
  if (pagination) {
    const { limit, offset } = pagination ?? {}
    query += ` limit ${literal(limit)} offset ${literal(offset)}`
  }
  return query + ';'
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
    throw { message: 'no filters for this update query' }
  }
  const queryColumns = Object.keys(value)
    .map((x) => ident(x))
    .join(',')
  let query = format(
    'update %1$s set (%2$s) = (select %2$s from json_populate_record(null::%1$s, %3$s))',
    queryTable(table),
    queryColumns,
    literal(JSON.stringify(value))
  )
  if (filters) {
    query = applyFilters(query, filters)
  }
  if (returning) {
    query +=
      enumArrayColumns === undefined || enumArrayColumns.length === 0
        ? ` returning *`
        : ` returning *, ${enumArrayColumns.map((x) => `"${x}"::text[]`).join(',')}`
  }

  return query + ';'
}

//============================================================
// Filter Utils
//============================================================

function applyFilters(query: string, filters: Filter[]) {
  if (filters.length === 0) return query
  query += ` where ${filters
    .map((filter) => {
      switch (filter.operator) {
        case 'in':
          return inFilterSql(filter)
        case 'is':
          return isFilterSql(filter)
        default:
          return `${ident(filter.column)} ${filter.operator} ${filterLiteral(filter.value)}`
      }
    })
    .join(' and ')}`
  return query
}

function inFilterSql(filter: Filter) {
  let values
  if (Array.isArray(filter.value)) {
    values = filter.value.map((x: any) => filterLiteral(x))
  } else {
    const filterValueTxt = String(filter.value)
    values = filterValueTxt.split(',').map((x: any) => filterLiteral(x))
  }
  return `${ident(filter.column)} ${filter.operator} (${values.join(',')})`
}

function isFilterSql(filter: Filter) {
  const filterValueTxt = String(filter.value)
  switch (filterValueTxt) {
    case 'null':
    case 'false':
    case 'true':
    case 'not null':
      return `${ident(filter.column)} ${filter.operator} ${filterValueTxt}`
    default:
      return `${ident(filter.column)} ${filter.operator} ${filterLiteral(filter.value)}`
  }
}

function filterLiteral(value: any) {
  if (typeof value === 'string') {
    if (value?.startsWith('ARRAY[') && value?.endsWith(']')) {
      return value
    } else {
      return literal(value)
    }
  }
  return value
}

//============================================================
// Sort Utils
//============================================================

function applySorts(query: string, sorts: Sort[]) {
  if (sorts.length === 0) return query
  query += ` order by ${sorts
    .map((x) => {
      if (!x.column) return null
      const order = x.ascending ? 'asc' : 'desc'
      const nullOrder = x.nullsFirst ? 'nulls first' : 'nulls last'
      return `${ident(x.table)}.${ident(x.column)} ${order} ${nullOrder}`
    })
    .join(', ')}`
  return query
}

//============================================================
// Misc
//============================================================

function queryTable(table: QueryTable) {
  return `${ident(table.schema)}.${ident(table.name)}`
}

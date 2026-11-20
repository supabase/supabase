/**
 * TEMPORARY. Delete once Spark (turso) runs `getTableRowsSql`, which fails there on `array_ndims`
 * and array slices.
 *
 * Selects the same page with the same casts but no truncation, and truncates large values in
 * TypeScript as `getTableRowsSql` does in SQL.
 */
import type { CatalogQuery, CatalogRow } from '../catalog-fallback'
import { ident, joinSqlFragments, keyword, safeSql } from '../pg-format'
import type { PGTable } from '../pg-meta-tables'
import { Query } from './Query'
import {
  formatPatternMatchFilterValue,
  getDefaultOrderByColumns,
  getPagination,
  MAX_ARRAY_SIZE,
  MAX_CHARACTERS,
  shouldTruncateColumn,
  TEXT_TYPES,
  THRESHOLD_COUNT,
  type BuildTableRowsQueryArgs,
} from './table-row-query'
import { arrayText } from './write-values.fallback'

const JSON_FORMATS = new Set(['json', 'jsonb'])
// Selected without `::text`: the value is already text, and a column turso reports as text can be
// an array, which its `::text` garbles.
const PLAIN_TEXT_FORMATS = new Set(['text', 'varchar', 'character varying'])

const byteLength = (text: string) => new TextEncoder().encode(text).length

function truncateText(value: unknown, maxCharacters: number) {
  if (typeof value !== 'string' || byteLength(value) <= maxCharacters) return value
  return `${Array.from(value).slice(0, maxCharacters).join('')}...`
}

/** `getTableRowsSql`'s marker row for a sliced multi-dimensional array, shaped like `like`. */
const markerShaped = (like: unknown, marker: unknown): unknown =>
  Array.isArray(like) ? like.map((item) => markerShaped(item, marker)) : marker

function truncateArray(
  value: unknown,
  {
    isJson,
    maxCharacters,
    maxArraySize,
  }: { isJson: boolean; maxCharacters: number; maxArraySize: number }
) {
  if (!Array.isArray(value) || byteLength(arrayText(value)) <= maxCharacters) return value
  const marker = isJson ? { truncated: true } : '...'
  const head = value.slice(0, maxArraySize)
  return [...head, Array.isArray(value[0]) ? markerShaped(value[0], marker) : marker]
}

/** Fallback for `getTableRowsSql`. */
export async function getTableRowsFallback(
  query: CatalogQuery,
  {
    table,
    filters = [],
    sorts = [],
    page,
    limit,
    maxCharacters = MAX_CHARACTERS,
    maxArraySize = MAX_ARRAY_SIZE,
    sortExcludedColumns = [],
  }: BuildTableRowsQueryArgs
): Promise<CatalogRow[]> {
  if (!table || !table.columns) return []
  const columns = [...table.columns]
    .sort((a, b) => a.ordinal_position - b.ordinal_position)
    .map((column) => {
      const format = column.format.toLowerCase()
      const isArray = column.data_type.toLowerCase() === 'array'
      return {
        name: column.name,
        isTruncated: shouldTruncateColumn(format),
        isArray: isArray && !shouldTruncateColumn(format),
        isJsonArray: isArray && JSON_FORMATS.has(format.slice(1)),
        format,
      }
    })

  const selectList = joinSqlFragments(
    columns.map(({ name, isTruncated, isArray, isJsonArray, format }) => {
      const column = ident(name)
      if (isTruncated) {
        return PLAIN_TEXT_FORMATS.has(format) ? column : safeSql`${column}::text as ${column}`
      }
      if (isArray) {
        const cast = isJsonArray ? safeSql`${keyword(format.slice(1))}[]` : safeSql`text[]`
        return safeSql`${column}::${cast} as ${column}`
      }
      return column
    }),
    ','
  )

  let chain = new Query().from(table.name, table.schema).select(selectList)
  filters.forEach((filter) => {
    const column = table.columns?.find((c) => c.name === filter.column)
    const isStringTypeColumn = column ? (TEXT_TYPES as string[]).includes(column.format) : true
    const value =
      !isStringTypeColumn && filter.value === ''
        ? null
        : formatPatternMatchFilterValue(filter.value, filter.operator)
    chain = chain.filter(filter.column, filter.operator, value)
  })
  const liveRowCount = (table as PGTable).live_rows_estimate || 0
  if (sorts.length === 0 && liveRowCount <= THRESHOLD_COUNT && table.columns.length > 0) {
    getDefaultOrderByColumns(table as PGTable, { excludedColumns: sortExcludedColumns }).forEach(
      (column) => {
        chain = chain.order(table.name, column)
      }
    )
  } else {
    sorts.forEach((sort) => {
      chain = chain.order(sort.table, sort.column, sort.ascending, sort.nullsFirst)
    })
  }
  const { from, to } = getPagination((page ?? 1) - 1, limit)

  const rows = await query(chain.range(from, to).toSql())
  return rows.map((row) => {
    const out: CatalogRow = { ...row }
    for (const { name, isTruncated, isArray, isJsonArray } of columns) {
      if (isTruncated) out[name] = truncateText(row[name], maxCharacters)
      else if (isArray) {
        out[name] = truncateArray(row[name], { isJson: isJsonArray, maxCharacters, maxArraySize })
      }
    }
    return out
  })
}

/**
 * TEMPORARY. Delete once Spark (turso) runs `json_populate_record` and `jsonb_populate_recordset`,
 * with the `columnFormats` option of `insert` and `update` in `Query`.
 *
 * The table editor writes rows through those functions; on a database that lacks them, the same
 * insert or update is built with literals typed by the table's column formats.
 */
import { toText, type CatalogQuery } from '../catalog-fallback'
import { literal, safeSql, type SafeSqlFragment } from '../pg-format'

/** A table's columns in ordinal order, with pg-meta's `format` (the base type for a domain). */
export type ColumnFormat = { name: string; format: string }

const JSON_FORMATS = new Set(['json', 'jsonb'])

const columnFormatsSql = (tableId: number) => safeSql`
select a.attname as name, coalesce(bt.typname, t.typname) as format
from pg_catalog.pg_attribute a
join pg_catalog.pg_type t on t.oid = a.atttypid
left join pg_catalog.pg_type bt on t.typtype = 'd' and bt.oid = t.typbasetype
where a.attrelid = ${literal(tableId)} and a.attnum > 0 and not a.attisdropped
order by a.attnum`

/** Reads the column formats a fallback write needs. */
export async function readColumnFormats(
  query: CatalogQuery,
  tableId: number
): Promise<ColumnFormat[]> {
  const rows = await query(columnFormatsSql(tableId))
  return rows.map((row) => ({ name: String(row.name), format: toText(row.format) ?? '' }))
}

const ARRAY_ELEMENT_NEEDS_QUOTES = /^$|^null$|[{}",\\\s]/i

function arrayElement(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (Array.isArray(value)) return arrayText(value)
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return ARRAY_ELEMENT_NEEDS_QUOTES.test(text) ? `"${text.replace(/["\\]/g, '\\$&')}"` : text
}

/** Postgres's text form of an array, which is also its input form. */
export const arrayText = (value: unknown[]): string => `{${value.map(arrayElement).join(',')}}`

/**
 * A literal that reads as `value` does through `json(b)_populate_record` into a column of `format`:
 * json columns take the JSON itself, arrays become array literals, booleans stay booleans.
 */
export function columnValueLiteral(value: unknown, format: string | undefined): SafeSqlFragment {
  if (value === null || value === undefined) return safeSql`null`
  if (format !== undefined && JSON_FORMATS.has(format)) return literal(JSON.stringify(value))
  if (Array.isArray(value)) return literal(arrayText(value))
  if (typeof value === 'boolean') return value ? safeSql`true` : safeSql`false`
  if (typeof value === 'object') return literal(JSON.stringify(value))
  return literal(value)
}

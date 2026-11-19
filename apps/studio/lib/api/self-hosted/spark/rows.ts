/**
 * TEMPORARY: the table editor's rows and count on Spark, built from the intent's arguments.
 *
 * pg-meta's row query wraps the page in a CTE that truncates large values with `octet_length`,
 * `left` and array slicing; this runs only the inner `select` on Spark and truncates here.
 * Exit condition: Spark runs `getTableRowsSql` and `getTableRowsCountSql` as written.
 */
import type { PGTable, QueryIntentArgs } from '@supabase/pg-meta'
import { Query } from '@supabase/pg-meta/src/query'
import {
  getTableRowsBaseSql,
  MAX_CHARACTERS,
  shouldTruncateColumn,
} from '@supabase/pg-meta/src/query/table-row-query'

import { typeInfo, type SparkModel } from './catalog'
import type { SparkClient, SparkRow } from './client'

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

/** Spark returns booleans as 0/1 and json and arrays as text. */
const coerce = (model: SparkModel, types: Map<string, string>, row: SparkRow): SparkRow => {
  const out: SparkRow = { ...row }
  for (const [key, value] of Object.entries(row)) {
    const type = types.get(key)
    if (type === undefined || value === null || value === undefined) continue
    const info = typeInfo(model.description, type)
    if (info.isArray && typeof value === 'string' && value.startsWith('['))
      out[key] = parseJson(value)
    else if (info.base === 'bool' && typeof value === 'number') out[key] = value !== 0
    else if ((info.base === 'json' || info.base === 'jsonb') && typeof value === 'string')
      out[key] = parseJson(value)
  }
  return out
}

export async function readRows(
  spark: SparkClient,
  model: SparkModel,
  args: QueryIntentArgs['rows.read']
): Promise<SparkRow[]> {
  const source = model.findTable(args.schema, args.name)
  if (source === undefined) return []
  const table = model.table(source) as PGTable
  const sql = getTableRowsBaseSql({
    table,
    filters: args.filters,
    sorts: args.sorts,
    page: args.page,
    limit: args.limit,
    sortExcludedColumns: args.sortExcludedColumns,
  })
  const types = new Map(source.columns.map((c) => [c.name, c.type]))
  const maxCharacters = args.maxCharacters ?? MAX_CHARACTERS
  const truncated = (table.columns ?? [])
    .filter((c) => shouldTruncateColumn(c.format))
    .map((c) => c.name)
  return (await spark.query(sql)).map((raw) => {
    const row = coerce(model, types, raw)
    for (const name of truncated) {
      const value = row[name]
      if (value === null || value === undefined) continue
      const text = typeof value === 'string' ? value : JSON.stringify(value)
      row[name] = text.length > maxCharacters ? `${text.slice(0, maxCharacters)}...` : text
    }
    return row
  })
}

export async function countRows(
  spark: SparkClient,
  model: SparkModel,
  { schema, name, filters = [] }: QueryIntentArgs['rows.count']
): Promise<[{ count: number; is_estimate: false }]> {
  if (model.findTable(schema, name) === undefined) return [{ count: 0, is_estimate: false }]
  let chain = new Query().from(name, schema).count()
  for (const f of filters.filter((x) => x.value && x.value !== '')) {
    chain = chain.filter(f.column, f.operator, f.value)
  }
  const rows = await spark.query(chain.toSql())
  return [{ count: Number(rows[0]?.count ?? 0), is_estimate: false }]
}

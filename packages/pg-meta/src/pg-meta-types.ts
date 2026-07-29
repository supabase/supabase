import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { literal, safeSql, type SafeSqlFragment } from './pg-format'
import { SCOPED_TYPES_SQL, TYPES_SQL } from './sql/types'

const pgTypeZod = z.object({
  id: z.number(),
  name: z.string(),
  schema: z.string(),
  format: z.string(),
  enums: z.array(z.string()),
  attributes: z.array(
    z.object({
      name: z.string(),
      type_id: z.number(),
    })
  ),
  comment: z.string().nullable(),
})

const pgTypeArrayZod = z.array(pgTypeZod)
export type PGType = z.infer<typeof pgTypeZod>

function list({
  includeArrayTypes = false,
  includeSystemSchemas = false,
  includedSchemas,
  excludedSchemas,
  limit,
  offset,
  scoped = false,
}: {
  includeArrayTypes?: boolean
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  limit?: number
  offset?: number
  scoped?: boolean
} = {}): {
  sql: SafeSqlFragment
  zod: typeof pgTypeArrayZod
} {
  // Both bases end at the same trailing WHERE `)`, so the filter/limit fragments
  // below extend the same single-level WHERE regardless of which base is used.
  // scoped=false keeps the rendered SQL byte-identical to the pre-change query.
  let sql = scoped ? SCOPED_TYPES_SQL : TYPES_SQL
  if (!includeArrayTypes) {
    sql = safeSql`${sql} and not exists (
      select from pg_type el
      where el.oid = t.typelem
        and el.typarray = t.oid
    )`
  }
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  if (filter) {
    sql = safeSql`${sql} and n.nspname ${filter}`
  }
  if (scoped) {
    // Scoped only: legacy TYPES_SQL has no ORDER BY (plan-dependent order); sort
    // the scoped result by t.oid for a stable, comparable order. Before LIMIT.
    sql = safeSql`${sql} order by t.oid`
  }
  if (limit) {
    sql = safeSql`${sql} limit ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} offset ${literal(offset)}`
  }
  return {
    sql,
    zod: pgTypeArrayZod,
  }
}

export { list }

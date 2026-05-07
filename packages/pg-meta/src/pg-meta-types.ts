import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { TYPES_SQL } from './sql/types'

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

function list({
  includeArrayTypes = false,
  includeSystemSchemas = false,
  includedSchemas,
  excludedSchemas,
  limit,
  offset,
}: {
  includeArrayTypes?: boolean
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  limit?: number
  offset?: number
} = {}): {
  sql: string
  zod: typeof pgTypeArrayZod
} {
  let sql = TYPES_SQL
  if (!includeArrayTypes) {
    sql += ` and not exists (
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
    sql += ` and n.nspname ${filter}`
  }
  if (limit) {
    sql += ` limit ${limit}`
  }
  if (offset) {
    sql += ` offset ${offset}`
  }
  return {
    sql,
    zod: pgTypeArrayZod,
  }
}

export default {
  list,
  zod: pgTypeZod,
}

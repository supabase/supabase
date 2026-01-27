import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { literal } from './pg-format'
import { INDEXES_SQL } from './sql/indexes'

const pgIndexZod = z.object({
  id: z.number(),
  table_id: z.number(),
  schema: z.string(),
  number_of_attributes: z.number(),
  number_of_key_attributes: z.number(),
  is_unique: z.boolean(),
  is_primary: z.boolean(),
  is_exclusion: z.boolean(),
  is_immediate: z.boolean(),
  is_clustered: z.boolean(),
  is_valid: z.boolean(),
  check_xmin: z.boolean(),
  is_ready: z.boolean(),
  is_live: z.boolean(),
  is_replica_identity: z.boolean(),
  key_attributes: z.array(z.number()),
  collation: z.array(z.number()),
  class: z.array(z.number()),
  options: z.array(z.number()),
  index_predicate: z.string().nullable(),
  comment: z.string().nullable(),
  index_definition: z.string(),
  access_method: z.string(),
  index_attributes: z.array(
    z.object({
      attribute_number: z.number(),
      attribute_name: z.string(),
      data_type: z.string(),
    })
  ),
})

const pgIndexArrayZod = z.array(pgIndexZod)
const pgIndexOptionalZod = z.optional(pgIndexZod)

function list({
  includeSystemSchemas = false,
  includedSchemas,
  excludedSchemas,
  limit,
  offset,
}: {
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  limit?: number
  offset?: number
} = {}): {
  sql: string
  zod: typeof pgIndexArrayZod
} {
  let sql = `
    with indexes as (${INDEXES_SQL})
    select *
    from indexes
  `
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  if (filter) {
    sql += ` where schema ${filter}`
  }
  if (limit) {
    sql += ` limit ${limit}`
  }
  if (offset) {
    sql += ` offset ${offset}`
  }
  return {
    sql,
    zod: pgIndexArrayZod,
  }
}

function retrieve({ id }: { id: number }): { sql: string; zod: typeof pgIndexOptionalZod } {
  const sql = `
    with indexes as (${INDEXES_SQL})
    select *
    from indexes
    where id = ${literal(id)};
  `
  return {
    sql,
    zod: pgIndexOptionalZod,
  }
}

export default {
  list,
  retrieve,
  zod: pgIndexZod,
}

import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { filterByList } from './helpers'
import { literal, safeSql, type SafeSqlFragment } from './pg-format'
import { SEQUENCES_SQL } from './sql/sequences'

const pgSequenceZod = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  owner: z.string(),
  data_type: z.string(),
  start_value: z.union([z.number(), z.string()]),
  increment_by: z.union([z.number(), z.string()]),
  max_value: z.union([z.number(), z.string()]),
  min_value: z.union([z.number(), z.string()]),
  cache_size: z.union([z.number(), z.string()]),
  cycle: z.boolean(),
  comment: z.string().nullable(),
})

const pgSequenceArrayZod = z.array(pgSequenceZod)
const pgSequenceOptionalZod = z.optional(pgSequenceZod)

export type PGSequence = z.infer<typeof pgSequenceZod>

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
  sql: SafeSqlFragment
  zod: typeof pgSequenceArrayZod
} {
  let sql = safeSql`
    with sequences as (${SEQUENCES_SQL})
    select *
    from sequences
  `
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  if (filter) {
    sql = safeSql`${sql} where schema ${filter}`
  }
  if (limit) {
    sql = safeSql`${sql} limit ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} offset ${literal(offset)}`
  }
  return {
    sql,
    zod: pgSequenceArrayZod,
  }
}

function retrieve({ id }: { id: number }): {
  sql: SafeSqlFragment
  zod: typeof pgSequenceOptionalZod
} {
  const sql = safeSql`
    with sequences as (${SEQUENCES_SQL})
    select *
    from sequences
    where id = ${literal(id)};
  `
  return {
    sql,
    zod: pgSequenceOptionalZod,
  }
}

export default {
  list,
  retrieve,
  zod: pgSequenceZod,
}

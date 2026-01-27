import { z } from 'zod'

import { CONFIG_SQL } from './sql/config'

const pgConfigZod = z.object({
  name: z.string(),
  setting: z.string(),
  category: z.string(),
  group: z.string(),
  subgroup: z.string(),
  unit: z.string().nullable(),
  short_desc: z.string(),
  extra_desc: z.string().nullable(),
  context: z.string(),
  vartype: z.string(),
  source: z.string(),
  min_val: z.string().nullable(),
  max_val: z.string().nullable(),
  enumvals: z.array(z.string()).nullable(),
  boot_val: z.string().nullable(),
  reset_val: z.string().nullable(),
  sourcefile: z.string().nullable(),
  sourceline: z.number().nullable(),
  pending_restart: z.boolean(),
})

const pgConfigArrayZod = z.array(pgConfigZod)

function list({
  limit,
  offset,
}: {
  limit?: number
  offset?: number
} = {}): {
  sql: string
  zod: typeof pgConfigArrayZod
} {
  let sql = CONFIG_SQL
  if (limit) {
    sql += ` LIMIT ${limit}`
  }
  if (offset) {
    sql += ` OFFSET ${offset}`
  }
  return {
    sql,
    zod: pgConfigArrayZod,
  }
}

export default {
  list,
  zod: pgConfigZod,
}

import { z } from 'zod'

import { ident, literal } from './pg-format'
import { EXTENSIONS_SQL } from './sql/extensions'

const pgExtensionZod = z.object({
  name: z.string(),
  schema: z.string().nullable(),
  default_version: z.string(),
  installed_version: z.string().nullable(),
  comment: z.string(),
})

const pgExtensionArrayZod = z.array(pgExtensionZod)
const pgExtensionOptionalZod = z.optional(pgExtensionZod)

export type PGExtension = z.infer<typeof pgExtensionZod>

function list({
  limit,
  offset,
}: {
  limit?: number
  offset?: number
} = {}): {
  sql: string
  zod: typeof pgExtensionArrayZod
} {
  let sql = EXTENSIONS_SQL
  if (limit) {
    sql = `${sql} LIMIT ${limit}`
  }
  if (offset) {
    sql = `${sql} OFFSET ${offset}`
  }
  return {
    sql,
    zod: pgExtensionArrayZod,
  }
}

function retrieve({ name }: { name: string }): {
  sql: string
  zod: typeof pgExtensionOptionalZod
} {
  const sql = `${EXTENSIONS_SQL} WHERE name = ${literal(name)};`
  return {
    sql,
    zod: pgExtensionOptionalZod,
  }
}

type ExtensionCreateParams = {
  name: string
  schema?: string
  version?: string
  cascade?: boolean
}

function create({ name, schema, version, cascade = false }: ExtensionCreateParams): {
  sql: string
} {
  const sql = `
CREATE EXTENSION ${ident(name)}
  ${schema === undefined ? '' : `SCHEMA ${ident(schema)}`}
  ${version === undefined ? '' : `VERSION ${literal(version)}`}
  ${cascade ? 'CASCADE' : ''};`
  return { sql }
}

type ExtensionUpdateParams = {
  update?: boolean
  version?: string
  schema?: string
}

function update(
  name: string,
  { update = false, version, schema }: ExtensionUpdateParams
): { sql: string } {
  let updateSql = ''
  if (update) {
    updateSql = `ALTER EXTENSION ${ident(name)} UPDATE ${
      version === undefined ? '' : `TO ${literal(version)}`
    };`
  }
  const schemaSql =
    schema === undefined ? '' : `ALTER EXTENSION ${ident(name)} SET SCHEMA ${ident(schema)};`

  const sql = `BEGIN; ${updateSql} ${schemaSql} COMMIT;`
  return { sql }
}

type ExtensionRemoveParams = {
  cascade?: boolean
}

function remove(name: string, { cascade = false }: ExtensionRemoveParams = {}): { sql: string } {
  const sql = `DROP EXTENSION ${ident(name)} ${cascade ? 'CASCADE' : 'RESTRICT'};`
  return { sql }
}

export default {
  list,
  retrieve,
  create,
  update,
  remove,
  zod: pgExtensionZod,
}

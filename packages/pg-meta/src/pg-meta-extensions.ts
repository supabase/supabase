import { z } from 'zod'

import { ident, literal, safeSql, type SafeSqlFragment } from './pg-format'
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
  sql: SafeSqlFragment
  zod: typeof pgExtensionArrayZod
} {
  let sql = EXTENSIONS_SQL
  if (limit) {
    sql = safeSql`${sql} LIMIT ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} OFFSET ${literal(offset)}`
  }
  return {
    sql,
    zod: pgExtensionArrayZod,
  }
}

function retrieve({ name }: { name: string }): {
  sql: SafeSqlFragment
  zod: typeof pgExtensionOptionalZod
} {
  const sql = safeSql`${EXTENSIONS_SQL} WHERE name = ${literal(name)};`
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
  sql: SafeSqlFragment
} {
  const sql = safeSql`
CREATE EXTENSION ${ident(name)}
  ${schema === undefined ? safeSql`` : safeSql`SCHEMA ${ident(schema)}`}
  ${version === undefined ? safeSql`` : safeSql`VERSION ${literal(version)}`}
  ${cascade ? safeSql`CASCADE` : safeSql``};`
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
): { sql: SafeSqlFragment } {
  let updateSql = safeSql``
  if (update) {
    updateSql = safeSql`ALTER EXTENSION ${ident(name)} UPDATE ${
      version === undefined ? safeSql`` : safeSql`TO ${literal(version)}`
    };`
  }
  const schemaSql =
    schema === undefined
      ? safeSql``
      : safeSql`ALTER EXTENSION ${ident(name)} SET SCHEMA ${ident(schema)};`

  const sql = safeSql`BEGIN; ${updateSql} ${schemaSql} COMMIT;`
  return { sql }
}

type ExtensionRemoveParams = {
  cascade?: boolean
}

function remove(
  name: string,
  { cascade = false }: ExtensionRemoveParams = {}
): {
  sql: SafeSqlFragment
} {
  const sql = safeSql`DROP EXTENSION ${ident(name)} ${cascade ? safeSql`CASCADE` : safeSql`RESTRICT`};`
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

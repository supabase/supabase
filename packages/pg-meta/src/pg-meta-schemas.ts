import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { ident, joinSqlFragments, literal, safeSql, type SafeSqlFragment } from './pg-format'
import { SCHEMAS_SQL } from './sql/schemas'

const pgSchemaZod = z.object({
  id: z.number(),
  name: z.string(),
  owner: z.string(),
  comment: z.string().nullable(),
})
const pgSchemaArrayZod = z.array(pgSchemaZod)
const pgSchemaOptionalZod = z.optional(pgSchemaZod)

function list({
  includeSystemSchemas = false,
  limit,
  offset,
}: {
  includeSystemSchemas?: boolean
  limit?: number
  offset?: number
} = {}): {
  sql: SafeSqlFragment
  zod: typeof pgSchemaArrayZod
} {
  let sql = SCHEMAS_SQL
  if (!includeSystemSchemas) {
    sql = safeSql`${sql} and not (n.nspname in (${joinSqlFragments(DEFAULT_SYSTEM_SCHEMAS.map(literal), ',')}))`
  }
  if (limit) {
    sql = safeSql`${sql} limit ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} offset ${literal(offset)}`
  }
  return {
    sql,
    zod: pgSchemaArrayZod,
  }
}

function retrieve({ id }: { id: number }): { sql: SafeSqlFragment; zod: typeof pgSchemaOptionalZod }
function retrieve({ name }: { name: string }): {
  sql: SafeSqlFragment
  zod: typeof pgSchemaOptionalZod
}
function retrieve({ id, name }: { id?: number; name?: string }): {
  sql: SafeSqlFragment
  zod: typeof pgSchemaOptionalZod
} {
  if (id) {
    const sql = safeSql`${SCHEMAS_SQL} and n.oid = ${literal(id)};`
    return {
      sql,
      zod: pgSchemaOptionalZod,
    }
  } else {
    const sql = safeSql`${SCHEMAS_SQL} and n.nspname = ${literal(name)};`
    return {
      sql,
      zod: pgSchemaOptionalZod,
    }
  }
}

type SchemaCreateParams = {
  name: string
  owner?: string
}
function create({ name, owner }: SchemaCreateParams): { sql: SafeSqlFragment } {
  const sql = safeSql`create schema ${ident(name)}
  ${owner === undefined ? safeSql`` : safeSql`authorization ${ident(owner)}`};
`
  return { sql }
}

type SchemaUpdateParams = {
  name?: string
  owner?: string
}
function update({ id }: { id: number }, params: SchemaUpdateParams): { sql: SafeSqlFragment }
function update({ name }: { name: string }, params: SchemaUpdateParams): { sql: SafeSqlFragment }
function update(
  {
    id,
    name,
  }: {
    id?: number
    name?: string
  },
  { name: newName, owner }: SchemaUpdateParams
): { sql: SafeSqlFragment } {
  const sql = safeSql`
do $$
declare
  id oid := ${id === undefined ? safeSql`${literal(name)}::regnamespace` : literal(id)};
  old record;
  new_name text := ${newName === undefined ? literal(null) : literal(newName)};
  new_owner text := ${owner === undefined ? literal(null) : literal(owner)};
begin
  select * into old from pg_namespace where oid = id;
  if old is null then
    raise exception 'Cannot find schema with id %', id;
  end if;

  if new_owner is not null then
    execute(format('alter schema %I owner to %I;', old.nspname, new_owner));
  end if;

  -- Using the same name in the rename clause gives an error, so only do it if the new name is different.
  if new_name is not null and new_name != old.nspname then
    execute(format('alter schema %I rename to %I;', old.nspname, new_name));
  end if;
end
$$;
`
  return { sql }
}

type SchemaRemoveParams = {
  cascade?: boolean
}
function remove({ id }: { id: number }, params?: SchemaRemoveParams): { sql: SafeSqlFragment }
function remove({ name }: { name: string }, params?: SchemaRemoveParams): { sql: SafeSqlFragment }
function remove(
  {
    id,
    name,
  }: {
    id?: number
    name?: string
  },
  { cascade = false }: SchemaRemoveParams = {}
): { sql: SafeSqlFragment } {
  const sql = safeSql`
do $$
declare
  id oid := ${id === undefined ? safeSql`${literal(name)}::regnamespace` : literal(id)};
  old record;
  cascade bool := ${literal(cascade)};
begin
  select * into old from pg_namespace where oid = id;
  if old is null then
    raise exception 'Cannot find schema with id %', id;
  end if;

  execute(format('drop schema %I %s;', old.nspname, case when cascade then 'cascade' else 'restrict' end));
end
$$;
`
  return { sql }
}

export default {
  list,
  retrieve,
  create,
  update,
  remove,
  zod: pgSchemaZod,
}

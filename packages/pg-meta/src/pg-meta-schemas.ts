import { z } from 'zod'

import { DEFAULT_SYSTEM_SCHEMAS } from './constants'
import { ident, joinSqlFragments, literal, safeSql, type SafeSqlFragment } from './pg-format'
import { SCHEMAS_SQL } from './sql/schemas'

// Pick a `$$…$$` delimiter for a `DO` block that is absent from every
// string in `values`. See the matching helper in `pg-meta-tables.ts`
// for the full rationale; the same dollar-quote-collision bug exists
// in the two DO blocks below (the `update` path and the `remove` path),
// both of which embed the `name` parameter via `${literal(name)}` and
// the `newName` / `owner` parameters via `${literal(...)}`, then run
// the resolved values through `format('alter schema %I ...', ...)`.
function getDoBlockDelimiter(values: string[]): SafeSqlFragment {
  let suffix = 0
  while (true) {
    const delimiter =
      suffix === 0
        ? (safeSql`$pg_meta$` as SafeSqlFragment)
        : (safeSql`$pg_meta_${literal(suffix)}$` as SafeSqlFragment)
    if (values.every((value) => !value.includes(delimiter))) {
      return delimiter
    }
    suffix += 1
  }
}

const pgSchemaZod = z.object({
  id: z.number(),
  name: z.string(),
  owner: z.string(),
  comment: z.string().nullable(),
})
const pgSchemaArrayZod = z.array(pgSchemaZod)
const pgSchemaOptionalZod = z.optional(pgSchemaZod)

export type PGSchema = z.infer<typeof pgSchemaZod>

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
  // The body of this DO block embeds the `name` parameter via
  // `${literal(name)}` (which renders to e.g. `'App$$x'::regnamespace`)
  // and the `newName` / `owner` parameters via `${literal(...)}`. The
  // resolved schema name (from `old.nspname`) and the new owner /
  // new name are then passed through
  // `format('alter schema %I ...', ...)`. If any of those values
  // contains the literal sequence `$$` the body is parsed as
  // truncated and the statement fails with a syntax error. Pick a
  // delimiter that is absent from every value that flows into the
  // body.
  const doBlockDelimiter = getDoBlockDelimiter([name ?? '', newName ?? '', owner ?? ''])
  const sql = safeSql`
do ${doBlockDelimiter}
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
${doBlockDelimiter};
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
  // Same dollar-quote-collision rationale as `update` above: the
  // `name` parameter is embedded via `${literal(name)}`, the
  // resolved schema name is then passed through
  // `format('drop schema %I %s;', old.nspname, ...)` inside the
  // body. If `name` contains `$$` the body is parsed as
  // truncated. Pick a delimiter that is absent from `name`.
  const doBlockDelimiter = getDoBlockDelimiter([name ?? ''])
  const sql = safeSql`
do ${doBlockDelimiter}
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
${doBlockDelimiter};
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

import { z } from 'zod'

import { ident, joinSqlFragments, literal, safeSql, type SafeSqlFragment } from './pg-format'
import { PUBLICATIONS_SQL } from './sql/publications'

const pgPublicationTableZod = z.object({
  id: z.number().optional(),
  name: z.string(),
  schema: z.string(),
})

const pgPublicationZod = z.object({
  id: z.number(),
  name: z.string(),
  owner: z.string(),
  publish_insert: z.boolean(),
  publish_update: z.boolean(),
  publish_delete: z.boolean(),
  publish_truncate: z.boolean(),
  tables: z.array(pgPublicationTableZod).nullable(),
})

const pgPublicationArrayZod = z.array(pgPublicationZod)
const pgPublicationOptionalZod = z.optional(pgPublicationZod)

export type PGPublication = z.infer<typeof pgPublicationZod>

function list({
  limit,
  offset,
}: {
  limit?: number
  offset?: number
} = {}): {
  sql: SafeSqlFragment
  zod: typeof pgPublicationArrayZod
} {
  let sql = safeSql`with publications as (${PUBLICATIONS_SQL}) select * from publications`
  if (limit) {
    sql = safeSql`${sql} limit ${literal(limit)}`
  }
  if (offset) {
    sql = safeSql`${sql} offset ${literal(offset)}`
  }
  return {
    sql,
    zod: pgPublicationArrayZod,
  }
}

type PublicationIdentifier = Pick<PGPublication, 'id'> | Pick<PGPublication, 'name'>

function getIdentifierWhereClause(identifier: PublicationIdentifier): SafeSqlFragment {
  if ('id' in identifier && identifier.id) {
    return safeSql`${ident('id')} = ${literal(identifier.id)}`
  } else if ('name' in identifier && identifier.name) {
    return safeSql`${ident('name')} = ${literal(identifier.name)}`
  }
  throw new Error('Must provide either id or name')
}

function retrieve(identifier: PublicationIdentifier): {
  sql: SafeSqlFragment
  zod: typeof pgPublicationOptionalZod
} {
  const sql = safeSql`with publications as (${PUBLICATIONS_SQL}) select * from publications where ${getIdentifierWhereClause(identifier)};`
  return {
    sql,
    zod: pgPublicationOptionalZod,
  }
}

type PublicationCreateParams = {
  name: string
  publish_insert?: boolean
  publish_update?: boolean
  publish_delete?: boolean
  publish_truncate?: boolean
  tables?: string[] | null
}

function create({
  name,
  publish_insert = false,
  publish_update = false,
  publish_delete = false,
  publish_truncate = false,
  tables = null,
}: PublicationCreateParams): { sql: SafeSqlFragment } {
  let tableClause: SafeSqlFragment
  if (tables === undefined || tables === null) {
    tableClause = safeSql`FOR ALL TABLES`
  } else if (tables.length === 0) {
    tableClause = safeSql``
  } else {
    tableClause = safeSql`FOR TABLE ${joinSqlFragments(
      tables.map((t) => {
        if (!t.includes('.')) {
          return ident(t)
        }
        const [schema, ...rest] = t.split('.')
        const table = rest.join('.')
        return safeSql`${ident(schema)}.${ident(table)}`
      }),
      ','
    )}`
  }

  const publishOps: Array<string> = []
  if (publish_insert) publishOps.push('insert')
  if (publish_update) publishOps.push('update')
  if (publish_delete) publishOps.push('delete')
  if (publish_truncate) publishOps.push('truncate')

  const sql = safeSql`
CREATE PUBLICATION ${ident(name)} ${tableClause}
  WITH (publish = ${literal(publishOps.join(','))});`

  return { sql }
}

type PublicationUpdateParams = {
  name?: string
  owner?: string
  publish_insert?: boolean
  publish_update?: boolean
  publish_delete?: boolean
  publish_truncate?: boolean
  tables?: string[] | null
}

/**
 * Splits a `schema.table` (or bare `table`) entry of `tables` into its schema
 * and table name. A bare name has no schema, so it resolves via the search path.
 * Mirrors how the entries were previously quoted: the first `.` separates the
 * schema, and any further `.` stay part of the table name.
 */
function splitPublicationTable(t: string): { schema: string | null; name: string } {
  if (!t.includes('.')) return { schema: null, name: t }
  const [schema, ...rest] = t.split('.')
  return { schema, name: rest.join('.') }
}

function textArray(values: Array<string | null>): SafeSqlFragment {
  return safeSql`array[${joinSqlFragments(
    values.map((v) => literal(v)),
    ', '
  )}]::text[]`
}

// The `execute` statements in the function body below follow the same rules as
// the ones in `pg-meta-table-privileges.ts`: no parentheses around the payload,
// and `format()` strings made only of `%I`/`%L` conversions (never `%s`), so a
// server that statically checks `DO` blocks (such as Multigres) can prove they
// build fixed statements.
function update(
  id: number,
  {
    name,
    owner,
    publish_insert,
    publish_update,
    publish_delete,
    publish_truncate,
    tables,
  }: PublicationUpdateParams
): { sql: SafeSqlFragment } {
  // 'keep' leaves the tables alone, 'all' publishes all tables, 'list' replaces
  // the published tables with the given ones.
  const tablesMode = tables === undefined ? 'keep' : tables === null ? 'all' : 'list'
  const tableEntries = (tables ?? []).map(splitPublicationTable)

  const sql = safeSql`
do $$
declare
  id oid := ${literal(id)};
  old record;
  r record;
  i int;
  new_name text := ${name === undefined ? literal(null) : literal(name)};
  new_owner text := ${owner === undefined ? literal(null) : literal(owner)};
  new_publish_insert bool := ${literal(publish_insert ?? null)};
  new_publish_update bool := ${literal(publish_update ?? null)};
  new_publish_delete bool := ${literal(publish_delete ?? null)};
  new_publish_truncate bool := ${literal(publish_truncate ?? null)};
  tables_mode text := ${literal(tablesMode)};
  new_table_schemas text[] := ${textArray(tableEntries.map((t) => t.schema))};
  new_table_names text[] := ${textArray(tableEntries.map((t) => t.name))};
begin
  select * into old from pg_publication where oid = id;
  if old is null then
    raise exception 'Cannot find publication with id %', id;
  end if;

  if tables_mode = 'keep' then
    null;
  elsif tables_mode = 'all' then
    if old.puballtables then
      null;
    else
      -- Need to recreate because going from list of tables <-> all tables with alter is not possible.
      execute format('drop publication %1$I; create publication %1$I for all tables;', old.pubname);
    end if;
  else
    if old.puballtables then
      -- Need to recreate because going from list of tables <-> all tables with alter is not possible.
      execute format('drop publication %1$I; create publication %1$I;', old.pubname);
    else
      for r in
        select n.nspname as schema_name, c.relname as table_name
        from pg_publication_rel pr
        join pg_class c on c.oid = pr.prrelid
        join pg_namespace n on n.oid = c.relnamespace
        where pr.prpubid = id
      loop
        execute format('alter publication %I drop table %I.%I', old.pubname, r.schema_name, r.table_name);
      end loop;
    end if;

    -- At this point the publication must have no tables.

    for i in 1 .. coalesce(cardinality(new_table_names), 0) loop
      if new_table_schemas[i] is null then
        execute format('alter publication %I add table %I', old.pubname, new_table_names[i]);
      else
        execute format('alter publication %I add table %I.%I', old.pubname, new_table_schemas[i], new_table_names[i]);
      end if;
    end loop;
  end if;

  execute format(
    'alter publication %I set (publish = %L);',
    old.pubname,
    concat_ws(
      ', ',
      case when coalesce(new_publish_insert, old.pubinsert) then 'insert' end,
      case when coalesce(new_publish_update, old.pubupdate) then 'update' end,
      case when coalesce(new_publish_delete, old.pubdelete) then 'delete' end,
      case when coalesce(new_publish_truncate, old.pubtruncate) then 'truncate' end
    )
  );

  execute format('alter publication %I owner to %I;', old.pubname, coalesce(new_owner, old.pubowner::regrole::name));

  -- Using the same name in the rename clause gives an error, so only do it if the new name is different.
  if new_name is not null and new_name != old.pubname then
    execute format('alter publication %I rename to %I;', old.pubname, coalesce(new_name, old.pubname));
  end if;

  -- We need to retrieve the publication later, so we need a way to uniquely identify which publication this is.
  -- We can't rely on id because it gets changed if it got recreated.
  -- We use a temp table to store the unique name - DO blocks can't return a value.
  create temp table pg_meta_publication_tmp (name) on commit drop as values (coalesce(new_name, old.pubname));
end $$;
`
  return { sql }
}

function remove(publication: Pick<PGPublication, 'name'>): { sql: SafeSqlFragment } {
  const sql = safeSql`DROP PUBLICATION IF EXISTS ${ident(publication.name)};`
  return { sql }
}

export default {
  list,
  retrieve,
  create,
  update,
  remove,
  zod: pgPublicationZod,
}

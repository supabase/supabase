import { z } from 'zod'

import { ident, literal } from './pg-format'
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
  sql: string
  zod: typeof pgPublicationArrayZod
} {
  let sql = `with publications as (${PUBLICATIONS_SQL}) select * from publications`
  if (limit) {
    sql += ` limit ${limit}`
  }
  if (offset) {
    sql += ` offset ${offset}`
  }
  return {
    sql,
    zod: pgPublicationArrayZod,
  }
}

type PublicationIdentifier = Pick<PGPublication, 'id'> | Pick<PGPublication, 'name'>

function getIdentifierWhereClause(identifier: PublicationIdentifier) {
  if ('id' in identifier && identifier.id) {
    return `${ident('id')} = ${literal(identifier.id)}`
  } else if ('name' in identifier && identifier.name) {
    return `${ident('name')} = ${literal(identifier.name)}`
  }
  throw new Error('Must provide either id or name')
}

function retrieve(identifier: PublicationIdentifier): {
  sql: string
  zod: typeof pgPublicationOptionalZod
} {
  const sql = `with publications as (${PUBLICATIONS_SQL}) select * from publications where ${getIdentifierWhereClause(identifier)};`
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
}: PublicationCreateParams): { sql: string } {
  let tableClause: string
  if (tables === undefined || tables === null) {
    tableClause = 'FOR ALL TABLES'
  } else if (tables.length === 0) {
    tableClause = ''
  } else {
    tableClause = `FOR TABLE ${tables
      .map((t) => {
        if (!t.includes('.')) {
          return ident(t)
        }

        const [schema, ...rest] = t.split('.')
        const table = rest.join('.')
        return `${ident(schema)}.${ident(table)}`
      })
      .join(',')}`
  }

  let publishOps = []
  if (publish_insert) publishOps.push('insert')
  if (publish_update) publishOps.push('update')
  if (publish_delete) publishOps.push('delete')
  if (publish_truncate) publishOps.push('truncate')

  const sql = `
CREATE PUBLICATION ${ident(name)} ${tableClause}
  WITH (publish = '${publishOps.join(',')}');`

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
): { sql: string } {
  const sql = `
do $$
declare
  id oid := ${literal(id)};
  old record;
  new_name text := ${name === undefined ? null : literal(name)};
  new_owner text := ${owner === undefined ? null : literal(owner)};
  new_publish_insert bool := ${publish_insert ?? null};
  new_publish_update bool := ${publish_update ?? null};
  new_publish_delete bool := ${publish_delete ?? null};
  new_publish_truncate bool := ${publish_truncate ?? null};
  new_tables text := ${
    tables === undefined
      ? null
      : literal(
          tables === null
            ? 'all tables'
            : tables
                .map((t) => {
                  if (!t.includes('.')) {
                    return ident(t)
                  }

                  const [schema, ...rest] = t.split('.')
                  const table = rest.join('.')
                  return `${ident(schema)}.${ident(table)}`
                })
                .join(',')
        )
  };
begin
  select * into old from pg_publication where oid = id;
  if old is null then
    raise exception 'Cannot find publication with id %', id;
  end if;

  if new_tables is null then
    null;
  elsif new_tables = 'all tables' then
    if old.puballtables then
      null;
    else
      -- Need to recreate because going from list of tables <-> all tables with alter is not possible.
      execute(format('drop publication %1$I; create publication %1$I for all tables;', old.pubname));
    end if;
  else
    if old.puballtables then
      -- Need to recreate because going from list of tables <-> all tables with alter is not possible.
      execute(format('drop publication %1$I; create publication %1$I;', old.pubname));
    elsif exists(select from pg_publication_rel where prpubid = id) then
      execute(
        format(
          'alter publication %I drop table %s',
          old.pubname,
          (select string_agg(prrelid::regclass::text, ', ') from pg_publication_rel where prpubid = id)
        )
      );
    end if;

    -- At this point the publication must have no tables.

    if new_tables != '' then
      execute(format('alter publication %I add table %s', old.pubname, new_tables));
    end if;
  end if;

  execute(
    format(
      'alter publication %I set (publish = %L);',
      old.pubname,
      concat_ws(
        ', ',
        case when coalesce(new_publish_insert, old.pubinsert) then 'insert' end,
        case when coalesce(new_publish_update, old.pubupdate) then 'update' end,
        case when coalesce(new_publish_delete, old.pubdelete) then 'delete' end,
        case when coalesce(new_publish_truncate, old.pubtruncate) then 'truncate' end
      )
    )
  );

  execute(format('alter publication %I owner to %I;', old.pubname, coalesce(new_owner, old.pubowner::regrole::name)));

  -- Using the same name in the rename clause gives an error, so only do it if the new name is different.
  if new_name is not null and new_name != old.pubname then
    execute(format('alter publication %I rename to %I;', old.pubname, coalesce(new_name, old.pubname)));
  end if;

  -- We need to retrieve the publication later, so we need a way to uniquely identify which publication this is.
  -- We can't rely on id because it gets changed if it got recreated.
  -- We use a temp table to store the unique name - DO blocks can't return a value.
  create temp table pg_meta_publication_tmp (name) on commit drop as values (coalesce(new_name, old.pubname));
end $$;
`
  return { sql }
}

function remove(publication: Pick<PGPublication, 'name'>): { sql: string } {
  const sql = `DROP PUBLICATION IF EXISTS ${ident(publication.name)};`
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

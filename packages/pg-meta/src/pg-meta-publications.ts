import { ident, literal } from './pg-format'
import { PUBLICATIONS_SQL } from './sql/publications'
import { z } from 'zod'

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

  const publishOps = [
    ...(publish_insert ? ['insert'] : []),
    ...(publish_update ? ['update'] : []),
    ...(publish_delete ? ['delete'] : []),
    ...(publish_truncate ? ['truncate'] : []),
  ]

  const sql = `CREATE PUBLICATION ${ident(name)} ${tableClause} WITH (publish = '${publishOps.join(
    ','
  )}');`
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
  identifier: PublicationIdentifier,
  params: PublicationUpdateParams
): { sql: string } {
  const sql = `
do $$
declare
  old record;
  new_name text := ${params.name === undefined ? null : literal(params.name)};
  new_owner text := ${params.owner === undefined ? null : literal(params.owner)};
  new_publish_insert bool := ${params.publish_insert ?? null};
  new_publish_update bool := ${params.publish_update ?? null};
  new_publish_delete bool := ${params.publish_delete ?? null};
  new_publish_truncate bool := ${params.publish_truncate ?? null};
  new_tables text := ${
    params.tables === undefined
      ? null
      : literal(
          params.tables === null
            ? 'all tables'
            : params.tables
                .map((t) => {
                  if (!t.includes('.')) {
                    return ident(t)
                  }
                  const [schema, ...rest] = t.split('.')
                  const table = rest.join('.')
                  return `${ident(schema)}.${ident(table)}`
                })
                .join(', ')
        )
  };
begin
  with publications as (${PUBLICATIONS_SQL})
  select * into old from publications where ${getIdentifierWhereClause(identifier)};
  if old is null then
    raise exception 'Cannot find publication with %', ${literal(getIdentifierWhereClause(identifier))};
  end if;
  if new_tables is null then
    null;
  elsif new_tables = 'all tables' AND old.tables is not null then
      -- Need to recreate because going from list of tables <-> all tables with alter is not possible.
      execute(format('drop publication %1$I; create publication %1$I for all tables;', old.name));
  else
    if old.tables is null then
      -- Need to recreate because going from list of tables <-> all tables with alter is not possible.
      execute(format('drop publication %1$I; create publication %1$I;', old.name));
    elsif exists(select from pg_publication_rel where prpubid = old.id) then
      execute(
        format(
          'alter publication %I drop table %s',
          old.name,
          (select string_agg(prrelid::regclass::text, ', ') from pg_publication_rel where prpubid = old.id)
        )
      );
    end if;

    -- At this point the publication must have no tables.
    if new_tables != '' then
      execute(format('alter publication %I add table %s', old.name, new_tables));
    end if;
  end if;

  execute(
    format(
      'alter publication %I set (publish = %L);',
      old.name,
      concat_ws(
        ', ',
        case when coalesce(new_publish_insert, old.publish_insert) then 'insert' end,
        case when coalesce(new_publish_update, old.publish_update) then 'update' end,
        case when coalesce(new_publish_delete, old.publish_delete) then 'delete' end,
        case when coalesce(new_publish_truncate, old.publish_truncate) then 'truncate' end
      )
    )
  );

  if new_owner is not null then
    execute(format('alter publication %I owner to %I;', old.name, new_owner));
  end if;

  -- Using the same name in the rename clause gives an error, so only do it if the new name is different.
  if new_name is not null and new_name != old.name then
    execute(format('alter publication %I rename to %I;', old.name, new_name));
  end if;
end $$;`
  return { sql }
}

function remove(identifier: PublicationIdentifier): { sql: string } {
  const sql = `
    do $$
    declare
      v_name name;
    begin
      with publications as (${PUBLICATIONS_SQL})
      select name into v_name from publications where ${getIdentifierWhereClause(identifier)};
      if v_name is not null then
            execute(format('drop publication if exists %I', v_name));
      end if;
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
  zod: pgPublicationZod,
}

import { ident, literal } from 'pg-format'
import { PostgresMetaResult, PostgresPublication } from './types.js'
import { PUBLICATIONS_SQL } from './sql/publications.sql.js'
import { filterByValue } from './helpers.js'

export default class PostgresMetaPublications {
  query: (sql: string) => Promise<PostgresMetaResult<any>>

  constructor(query: (sql: string) => Promise<PostgresMetaResult<any>>) {
    this.query = query
  }

  async list({
    limit,
    offset,
  }: {
    limit?: number
    offset?: number
  }): Promise<PostgresMetaResult<PostgresPublication[]>> {
    let sql = PUBLICATIONS_SQL({ limit, offset })
    return await this.query(sql)
  }

  async retrieve({ id }: { id: number }): Promise<PostgresMetaResult<PostgresPublication>>
  async retrieve({ name }: { name: string }): Promise<PostgresMetaResult<PostgresPublication>>
  async retrieve({
    id,
    name,
  }: {
    id?: number
    name?: string
  }): Promise<PostgresMetaResult<PostgresPublication>> {
    if (id) {
      const idsFilter = filterByValue([id])
      const sql = PUBLICATIONS_SQL({ idsFilter })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return { data: null, error: { message: `Cannot find a publication with ID ${id}` } }
      } else {
        return { data: data[0], error }
      }
    } else if (name) {
      const nameFilter = filterByValue([name])
      const sql = PUBLICATIONS_SQL({ nameFilter })
      const { data, error } = await this.query(sql)
      if (error) {
        return { data, error }
      } else if (data.length === 0) {
        return { data: null, error: { message: `Cannot find a publication named ${name}` } }
      } else {
        return { data: data[0], error }
      }
    } else {
      return { data: null, error: { message: 'Invalid parameters on publication retrieve' } }
    }
  }

  async create({
    name,
    publish_insert = false,
    publish_update = false,
    publish_delete = false,
    publish_truncate = false,
    tables = null,
  }: {
    name: string
    publish_insert?: boolean
    publish_update?: boolean
    publish_delete?: boolean
    publish_truncate?: boolean
    tables?: string[] | null
  }): Promise<PostgresMetaResult<PostgresPublication>> {
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
    const { error } = await this.query(sql)
    if (error) {
      return { data: null, error }
    }
    return await this.retrieve({ name })
  }

  async update(
    id: number,
    {
      name,
      owner,
      publish_insert,
      publish_update,
      publish_delete,
      publish_truncate,
      tables,
    }: {
      name?: string
      owner?: string
      publish_insert?: boolean
      publish_update?: boolean
      publish_delete?: boolean
      publish_truncate?: boolean
      tables?: string[] | null
    }
  ): Promise<PostgresMetaResult<PostgresPublication>> {
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

with publications as (${PUBLICATIONS_SQL({})}) select * from publications where name = (select name from pg_meta_publication_tmp);
`
    const { data, error } = await this.query(sql)
    if (error) {
      return { data: null, error }
    }
    return { data: data[0], error }
  }

  async remove(id: number): Promise<PostgresMetaResult<PostgresPublication>> {
    const { data: publication, error } = await this.retrieve({ id })
    if (error) {
      return { data: null, error }
    }
    const sql = `DROP PUBLICATION IF EXISTS ${ident(publication!.name)};`
    {
      const { error } = await this.query(sql)
      if (error) {
        return { data: null, error }
      }
    }
    return { data: publication!, error: null }
  }
}

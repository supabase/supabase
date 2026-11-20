import { afterAll, describe, expect } from 'vitest'

import pgMeta, {
  getDatabaseExtensionsSQL,
  getDefaultPrivilegesStateSql,
  getEventTriggersSql,
  getExposedFunctionCountsSql,
  getExposedFunctionsSql,
  getExposedTableCountsSql,
  getExposedTablesSql,
  getFDWsSql,
  getForeignKeyConstraintsSql,
  getIndexesSQL,
  getIndexWorkerStatusSQL,
  getKeywordsSql,
  getTableColumnsSql,
  getTableConstraintsSql,
  getUsersCountSQL,
  literal,
  safeSql,
  type CatalogQuery,
} from '../src'
import {
  getDatabaseExtensionsFallback,
  listExtensionsFallback,
} from '../src/sql/extensions.fallback'
import { listFunctionsFallback } from '../src/sql/functions.fallback'
import { listPublicationsFallback } from '../src/sql/publications.fallback'
import { listRolesFallback } from '../src/sql/roles.fallback'
import { listSchemasFallback } from '../src/sql/schemas.fallback'
import { getIndexWorkerStatusFallback } from '../src/sql/studio/auth/get-index-worker-status.fallback'
import { getUsersCountFallback } from '../src/sql/studio/auth/get-users-count.fallback'
import { getTableColumnsFallback } from '../src/sql/studio/database/columns.fallback'
import { getEventTriggersFallback } from '../src/sql/studio/database/event-triggers.fallback'
import { getFDWsFallback } from '../src/sql/studio/database/fdw.fallback'
import { getIndexesFallback } from '../src/sql/studio/database/indexes.fallback'
import {
  getDefaultPrivilegesStateFallback,
  getExposedFunctionCountsFallback,
  getExposedFunctionsFallback,
  getExposedTableCountsFallback,
  getExposedTablesFallback,
} from '../src/sql/studio/database/privileges.fallback'
import { getKeywordsFallback } from '../src/sql/studio/sql-editor/keywords.fallback'
import { getTableConstraintsFallback } from '../src/sql/studio/table-editor/constraints.fallback'
import { getForeignKeyConstraintsFallback } from '../src/sql/studio/table-editor/foreign-keys.fallback'
import { listTablePrivilegesFallback } from '../src/sql/table-privileges.fallback'
import { listTriggersFallback } from '../src/sql/triggers.fallback'
import { listTypesFallback } from '../src/sql/types.fallback'
import {
  listForeignTablesFallback,
  listMaterializedViewsFallback,
  listViewsFallback,
} from '../src/sql/views.fallback'
import { catalogFallbackHarness } from './db/catalog-fallback-harness'
import { cleanupRoot, createDatabaseWithAuthSchema } from './db/utils'

afterAll(async () => {
  await cleanupRoot()
})

const POSTGRES_SCHEMA = `
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
do $$ begin create role service_role; exception when duplicate_object then null; end $$;
create schema other;
comment on schema other is 'other things';
create type public.mood as enum ('happy', 'sad');
create type public.pair as (a int, b text);
create table public.authors (id bigint generated always as identity primary key, email text unique,
  mood public.mood, active boolean default true);
create table public.posts (id bigint primary key, author_id bigint references public.authors (id)
  on delete cascade, a int, b int, title text check (length(title) > 0), unique (a, b));
create index posts_lower_title on public.posts (lower(title));
create index posts_author on public.posts (author_id, a);
create table public.pair_notes (a int, b int, foreign key (a, b) references public.posts (a, b));
create view public.author_emails as select id, email from public.authors;
create materialized view public.author_count as select count(*) as n from public.authors;
create publication pub_some for table public.authors, public.posts;
create publication pub_all for all tables;
create function public.add_one(a int, b int default 1, out total int) language sql immutable
  as $$ select a + b $$;
create function public.touch() returns trigger language plpgsql set search_path = public
  as $$ begin return new; end $$;
create procedure public.noop() language sql as $$ select 1 $$;
create trigger posts_touch before insert or update on public.posts for each row
  when (new.a > 0) execute function public.touch('x', 'y');
create trigger authors_touch after delete on public.authors for each statement
  execute function public.touch();
create function public.on_ddl() returns event_trigger language plpgsql as $$ begin end $$;
create event trigger log_ddl on ddl_command_end when tag in ('CREATE TABLE')
  execute function public.on_ddl();
create extension if not exists pg_trgm with schema other;
create extension if not exists postgres_fdw;
create server remote foreign data wrapper postgres_fdw options (host 'localhost', dbname 'x');
create foreign table other.remote_items (id int, label text) server remote
  options (table_name 'items');
grant select on public.authors to anon;
grant select, insert, update, delete on public.posts to anon, authenticated, service_role;
grant execute on function public.add_one(int, int) to anon;
alter default privileges for role postgres in schema public grant select on tables to anon;
`

const SPARK_SCHEMA = `
create table public.authors (id bigint generated by default as identity primary key, name text not null, active boolean not null default true);
create table public.posts (id bigint generated by default as identity primary key, author_id bigint references public.authors (id) on delete cascade, title text not null unique, body text, constraint body_len check (length(body) < 100));
create index posts_author_idx on public.posts (author_id);
alter table public.posts enable row level security;
create view public.post_titles as select id, title from public.posts;
revoke select on table public.authors from anon;
`

const { postgresTest, sparkTest, sparkFallback } = catalogFallbackHarness({
  postgresSchema: POSTGRES_SCHEMA,
  sparkSchema: SPARK_SCHEMA,
})

const IGNORED_SCHEMAS = ['information_schema', 'pg_catalog', 'pg_toast', 'other']

const byKey =
  (...keys: string[]) =>
  (a: any, b: any) => {
    for (const key of keys) {
      const [x, y] = [String(a[key]), String(b[key])]
      if (x !== y) return x < y ? -1 : 1
    }
    return 0
  }
const sorted = <T>(rows: T[], ...keys: string[]) => [...rows].sort(byKey(...keys))

describe('schemas, roles and types', () => {
  postgresTest('the fallbacks return what the pg-meta queries return', async (query) => {
    for (const options of [{}, { includeSystemSchemas: true }]) {
      expect(sorted(await listSchemasFallback(query, options), 'id')).toEqual(
        sorted(await query(pgMeta.schemas.list(options).sql), 'id')
      )
    }
    const withoutConnections = (roles: any[]) =>
      sorted(
        roles.map(({ activeConnections, ...role }) => role),
        'id'
      )
    for (const options of [{}, { includeDefaultRoles: true }]) {
      expect(withoutConnections(await listRolesFallback(query, options))).toEqual(
        withoutConnections(await query(pgMeta.roles.list(options).sql))
      )
    }
    for (const options of [
      { includedSchemas: ['public'] },
      { includedSchemas: ['public'], includeArrayTypes: true },
    ]) {
      const expected = await query(pgMeta.types.list(options).sql)
      expect(expected.map((type) => type.name)).toEqual(expect.arrayContaining(['mood', 'pair']))
      expect(await listTypesFallback(query, options)).toEqual(expected)
    }
  })

  sparkTest('the fallbacks list the schemas and roles, and no types', async (query) => {
    const schemas = await sparkFallback(pgMeta.schemas.list().sql, () => listSchemasFallback(query))
    expect(schemas.map((schema) => schema.name)).toEqual(
      expect.arrayContaining(['public', 'auth', 'storage'])
    )
    const roles = await sparkFallback(pgMeta.roles.list().sql, () => listRolesFallback(query))
    expect(roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'postgres', isSuperuser: true, activeConnections: 0 }),
        expect.objectContaining({ name: 'anon', isSuperuser: false, canLogin: false }),
      ])
    )
    expect(
      await sparkFallback(pgMeta.types.list({ includedSchemas: ['public'] }).sql, () =>
        listTypesFallback(query, { includedSchemas: ['public'] })
      )
    ).toEqual([])
  })
})

describe('views, materialized views, foreign tables and publications', () => {
  // turso has no pg_relation_is_updatable or pg_column_is_updatable.
  const withoutUpdatable = (rows: any[]) =>
    sorted(
      rows.map(({ is_updatable, columns, ...row }) => ({
        ...row,
        ...(columns && {
          columns: sorted(
            columns.map(({ is_updatable, ...column }: any) => column),
            'ordinal_position'
          ),
        }),
      })),
      'id'
    )

  postgresTest('the fallbacks return what the pg-meta queries return', async (query) => {
    for (const [list, fallback] of [
      [pgMeta.views.list, listViewsFallback],
      [pgMeta.materializedViews.list, listMaterializedViewsFallback],
      [pgMeta.foreignTables.list, listForeignTablesFallback],
    ] as const) {
      for (const options of [{}, { includeColumns: false }, { includedSchemas: ['other'] }]) {
        const expected = withoutUpdatable(await query(list(options).sql))
        expect(await withoutUpdatable(await fallback(query, options))).toEqual(expected)
      }
    }
    const publications = (rows: any[]) =>
      sorted(
        rows.map((row) => ({ ...row, tables: row.tables && sorted(row.tables, 'id') })),
        'id'
      )
    const expected = publications(await query(pgMeta.publications.list().sql))
    expect(expected).toHaveLength(2)
    expect(publications(await listPublicationsFallback(query))).toEqual(expected)
  })

  sparkTest('the fallbacks run, and turso lists no views', async (query) => {
    const options = { includedSchemas: ['public'] }
    expect(
      await sparkFallback(pgMeta.views.list(options).sql, () => listViewsFallback(query, options))
    ).toEqual([])
    expect(
      await sparkFallback(pgMeta.materializedViews.list(options).sql, () =>
        listMaterializedViewsFallback(query, options)
      )
    ).toEqual([])
    expect(
      await sparkFallback(pgMeta.foreignTables.list(options).sql, () =>
        listForeignTablesFallback(query, options)
      )
    ).toEqual([])
    expect(
      await sparkFallback(pgMeta.publications.list().sql, () => listPublicationsFallback(query))
    ).toEqual([])
  })
})

describe('extensions, functions, triggers, event triggers and foreign data wrappers', () => {
  const installed = (rows: any[]) =>
    sorted(
      rows
        .filter((row) => row.installed_version !== null)
        .map(({ default_version, comment, default_version_schema, ...row }) => row),
      'name'
    )
  const triggers = (rows: any[]) =>
    sorted(
      rows.map((row) => ({ ...row, events: [...row.events].sort() })),
      'id'
    )
  const fdws = (rows: any[]) =>
    sorted(
      rows.map((row) => ({
        ...row,
        tables:
          row.tables &&
          sorted(
            row.tables.map((table: any) => ({
              ...table,
              columns: table.columns && sorted(table.columns, 'name'),
            })),
            'id'
          ),
      })),
      'id'
    )

  postgresTest('the fallbacks return what the queries return', async (query) => {
    const extensions = installed(await query(pgMeta.extensions.list().sql))
    expect(extensions.map((extension) => extension.name)).toEqual(
      expect.arrayContaining(['pg_trgm', 'postgres_fdw'])
    )
    expect(installed(await listExtensionsFallback(query))).toEqual(extensions)
    expect(installed(await getDatabaseExtensionsFallback(query))).toEqual(
      installed(await query(getDatabaseExtensionsSQL()))
    )

    const functions = await query(pgMeta.functions.list({ includedSchemas: ['public'] }).sql)
    expect(functions.map((f) => f.name)).toEqual(
      expect.arrayContaining(['add_one', 'touch', 'noop', 'on_ddl'])
    )
    expect(
      sorted(await listFunctionsFallback(query, { includedSchemas: ['public'] }), 'id')
    ).toEqual(sorted(functions, 'id'))

    const expectedTriggers = triggers(await query(pgMeta.triggers.list().sql))
    expect(expectedTriggers).toHaveLength(2)
    expect(triggers(await listTriggersFallback(query))).toEqual(expectedTriggers)

    const eventTriggers = await query(getEventTriggersSql())
    expect(eventTriggers).toHaveLength(1)
    expect(await getEventTriggersFallback(query)).toEqual(eventTriggers)

    const expectedFdws = fdws(await query(getFDWsSql()))
    expect(expectedFdws.map((fdw) => fdw.server_name)).toContain('remote')
    expect(fdws(await getFDWsFallback(query))).toEqual(expectedFdws)
  })

  sparkTest('the fallbacks run and list nothing Spark cannot create', async (query) => {
    expect(
      await sparkFallback(pgMeta.extensions.list().sql, () => listExtensionsFallback(query))
    ).toEqual([])
    expect(
      await sparkFallback(getDatabaseExtensionsSQL(), () => getDatabaseExtensionsFallback(query))
    ).toEqual([])
    const options = { includedSchemas: ['public'] }
    expect(
      await sparkFallback(pgMeta.functions.list(options).sql, () =>
        listFunctionsFallback(query, options)
      )
    ).toEqual([])
    expect(
      await sparkFallback(pgMeta.triggers.list(options).sql, () =>
        listTriggersFallback(query, options)
      )
    ).toEqual([])
    expect(
      await sparkFallback(getEventTriggersSql(), () => getEventTriggersFallback(query))
    ).toEqual([])
    expect(await sparkFallback(getFDWsSql(), () => getFDWsFallback(query))).toEqual([])
  })
})

describe('indexes, constraints, foreign keys and the SQL editor columns', () => {
  const tableId = async (query: CatalogQuery, name: string) => {
    const [{ id }] = await query(
      safeSql`select oid::int8 as id from pg_class where relname = ${literal(name)}`
    )
    return Number(id)
  }
  const tableColumns = (rows: any[]) =>
    sorted(
      rows.map((row) => ({
        ...row,
        columns: row.columns[0] === null ? row.columns : sorted(row.columns, 'attnum'),
      })),
      'quoted_name'
    )

  postgresTest('the fallbacks return what the queries return', async (query) => {
    const indexes = await query(getIndexesSQL({ schema: 'public' }))
    expect(indexes.map((index) => index.columns)).toEqual(
      expect.arrayContaining(['(expression)', 'author_id, a'])
    )
    expect(await getIndexesFallback(query, { schema: 'public' })).toEqual(indexes)

    const id = await tableId(query, 'posts')
    expect(sorted(await getTableConstraintsFallback(query, { id }), 'id')).toEqual(
      sorted(await query(getTableConstraintsSql({ id })), 'id')
    )

    const foreignKeys = await query(getForeignKeyConstraintsSql({ schema: 'public' }))
    expect(foreignKeys.map((fk) => fk.source_table)).toEqual(
      expect.arrayContaining(['posts', 'pair_notes'])
    )
    expect(
      sorted(await getForeignKeyConstraintsFallback(query, { schema: 'public' }), 'id')
    ).toEqual(sorted(foreignKeys, 'id'))

    for (const args of [{ schema: 'public' }, { schema: 'public', table: 'posts' }, {}]) {
      expect(tableColumns(await getTableColumnsFallback(query, args))).toEqual(
        tableColumns(await query(getTableColumnsSql(args)))
      )
    }
  })

  sparkTest('the fallbacks describe the posts table', async (query) => {
    const indexes = await sparkFallback(getIndexesSQL({ schema: 'public' }), () =>
      getIndexesFallback(query, { schema: 'public' })
    )
    expect(indexes).toEqual(
      expect.arrayContaining([
        {
          schema: 'public',
          table: 'posts',
          name: 'posts_author_idx',
          definition: 'CREATE INDEX posts_author_idx ON public.posts USING btree (author_id)',
          columns: 'author_id',
        },
      ])
    )

    const id = await tableId(query, 'posts')
    const constraints = await sparkFallback(getTableConstraintsSql({ id }), () =>
      getTableConstraintsFallback(query, { id })
    )
    expect(constraints.map(({ name, type }) => `${name}:${type}`).sort()).toEqual([
      'body_len:c',
      'posts_author_id_fkey:f',
      'posts_pkey:p',
      'posts_title_key:u',
    ])

    const foreignKeys = await sparkFallback(getForeignKeyConstraintsSql({ schema: 'public' }), () =>
      getForeignKeyConstraintsFallback(query, { schema: 'public' })
    )
    expect(foreignKeys).toMatchObject([
      {
        constraint_name: 'posts_author_id_fkey',
        deletion_action: 'c',
        source_table: 'posts',
        source_columns: '{author_id}',
        target_table: 'authors',
        target_columns: '{id}',
      },
    ])

    const columns = await sparkFallback(getTableColumnsSql({ schema: 'public' }), () =>
      getTableColumnsFallback(query, { schema: 'public' })
    )
    expect(columns.find((table) => table.tablename === 'posts')).toMatchObject({
      quoted_name: 'public.posts',
      is_table: true,
      columns: [
        { attname: 'id', data_type: 'bigint' },
        { attname: 'author_id', data_type: 'bigint' },
        { attname: 'title', data_type: 'text' },
        { attname: 'body', data_type: 'text' },
      ],
    })
  })
})

describe('Data API privileges', () => {
  const privileges = (rows: any[]) =>
    sorted(
      rows.map((row) => ({
        ...row,
        privileges: sorted(row.privileges, 'grantee', 'privilege_type', 'grantor'),
      })),
      'relation_id'
    )

  postgresTest('the fallbacks return what the pg-meta queries return', async (query) => {
    for (const options of [{ includedSchemas: ['public'] }, { includedSchemas: ['other'] }]) {
      expect(privileges(await listTablePrivilegesFallback(query, options))).toEqual(
        privileges(await query(pgMeta.tablePrivileges.list(options).sql))
      )
    }
    for (const args of [
      { offset: 0, limit: 50, ignoredSchemas: IGNORED_SCHEMAS },
      { offset: 1, limit: 2, ignoredSchemas: IGNORED_SCHEMAS, search: 'p' },
    ]) {
      expect(await getExposedTablesFallback(query, args)).toEqual(
        await query(getExposedTablesSql(args))
      )
      expect(await getExposedFunctionsFallback(query, args)).toEqual(
        await query(getExposedFunctionsSql(args))
      )
    }
    const counts = { selectedSchemas: ['public'], ignoredSchemas: IGNORED_SCHEMAS }
    expect(await getExposedTableCountsFallback(query, counts)).toEqual(
      await query(getExposedTableCountsSql(counts))
    )
    expect(await getExposedFunctionCountsFallback(query, counts)).toEqual(
      await query(getExposedFunctionCountsSql(counts))
    )
    for (const schema of ['public', 'other']) {
      expect(await getDefaultPrivilegesStateFallback(query, { schema })).toEqual(
        await query(getDefaultPrivilegesStateSql({ schema }))
      )
    }
  })

  sparkTest('the fallbacks read the grants from the ACLs', async (query) => {
    const options = { includedSchemas: ['public'] }
    const relations = await sparkFallback(pgMeta.tablePrivileges.list(options).sql, () =>
      listTablePrivilegesFallback(query, options)
    )
    const held = (name: string) =>
      relations
        .find((relation) => relation.name === name)
        ?.privileges.filter(({ privilege_type }) => privilege_type === 'SELECT')
        .map(({ grantee }) => grantee)
    expect(held('posts')).toEqual(expect.arrayContaining(['anon', 'authenticated', 'service_role']))
    expect(held('authors')).not.toContain('anon')

    const args = { offset: 0, limit: 50, ignoredSchemas: IGNORED_SCHEMAS }
    const [exposed] = await sparkFallback(getExposedTablesSql(args), () =>
      getExposedTablesFallback(query, args)
    )
    expect(exposed.tables.filter((table) => table.schema === 'public')).toMatchObject([
      // Spark gives the API roles no default grants on a table whose migration revokes any.
      { name: 'authors', status: 'revoked' },
      { name: 'posts', status: 'granted' },
    ])
    const counts = { selectedSchemas: ['public'], ignoredSchemas: IGNORED_SCHEMAS }
    expect(
      await sparkFallback(getExposedTableCountsSql(counts), () =>
        getExposedTableCountsFallback(query, counts)
      )
    ).toEqual([{ total_count: exposed.total_count, grants_count: 1 }])
    expect(
      await sparkFallback(getExposedFunctionsSql(args), () =>
        getExposedFunctionsFallback(query, args)
      )
    ).toEqual([{ total_count: 0, functions: [] }])
    expect(
      await sparkFallback(getExposedFunctionCountsSql(counts), () =>
        getExposedFunctionCountsFallback(query, counts)
      )
    ).toEqual([{ total_count: 0, grants_count: 0 }])
    expect(
      await sparkFallback(getDefaultPrivilegesStateSql(), () =>
        getDefaultPrivilegesStateFallback(query)
      )
    ).toEqual([{ grant_count: 0 }])
  })
})

describe('auth users count and index worker', () => {
  postgresTest('the fallbacks return what the queries return', async (query, db) => {
    await createDatabaseWithAuthSchema(db)
    await query(safeSql`
      insert into auth.users (id, email, email_confirmed_at)
      values (gen_random_uuid(), 'a@example.com', now()), (gen_random_uuid(), 'b@example.com', null);
      analyze auth.users`)
    for (const args of [{}, { filter: 'verified' as const }, { keywords: 'a@' }]) {
      expect(await getUsersCountFallback(query, args)).toEqual(await query(getUsersCountSQL(args)))
    }
    expect(await getIndexWorkerStatusFallback()).toEqual(await query(getIndexWorkerStatusSQL()))
  })

  sparkTest('the fallbacks count Spark’s auth users exactly', async (query) => {
    expect(
      await sparkFallback(getUsersCountSQL({}), () => getUsersCountFallback(query, {}))
    ).toEqual([{ count: 0, is_estimate: false }])
    expect(
      await sparkFallback(getIndexWorkerStatusSQL(), () => getIndexWorkerStatusFallback())
    ).toEqual([{ is_in_progress: false }])
  })
})

describe('SQL editor keywords', () => {
  postgresTest('the keyword list comes from pg_get_keywords, which turso lacks', async (query) => {
    const keywords = await query(getKeywordsSql())
    expect(keywords.map(({ word }) => word)).toEqual(expect.arrayContaining(['select', 'from']))
  })

  sparkTest('the fallback lists no keywords', async () => {
    expect(await sparkFallback(getKeywordsSql(), () => getKeywordsFallback())).toEqual([])
  })
})

import { afterAll, expect, test } from 'vitest'

import {
  getCreateMigrationsTableSQL,
  getInsertMigrationSQL,
  getMigrationsSql,
} from '../../../src/sql/studio/database/migrations'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (
  name: string,
  fn: (db: Awaited<ReturnType<typeof createTestDatabase>>) => Promise<void>
) => {
  test(name, async () => {
    const db = await createTestDatabase()

    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

withTestDatabase(
  'returns zero rows (not an error) when the migrations table does not exist',
  async ({ executeQuery }) => {
    // Regression test: this used to throw 42P01 (undefined_table), which surfaced
    // as a 400 on every dashboard load for projects without migrations.
    const result = await executeQuery(getMigrationsSql())
    expect(result).toEqual([])
  }
)

withTestDatabase(
  'returns migrations ordered by version desc when the table exists',
  async ({ executeQuery }) => {
    await executeQuery(getCreateMigrationsTableSQL())
    await executeQuery(
      getInsertMigrationSQL({
        version: '20240101000000',
        name: 'create_users',
        statements: JSON.stringify(['create table public.users (id int primary key)']),
      })
    )
    await executeQuery(
      getInsertMigrationSQL({
        version: '20240202000000',
        name: `special <chars> & "quotes" 'apostrophes'`,
        statements: JSON.stringify([`select '<a>&amp;</a>' as x`, 'select 2']),
      })
    )

    const result = await executeQuery(getMigrationsSql())

    expect(result).toEqual([
      {
        version: '20240202000000',
        name: `special <chars> & "quotes" 'apostrophes'`,
        statements: [`select '<a>&amp;</a>' as x`, 'select 2'],
      },
      {
        version: '20240101000000',
        name: 'create_users',
        statements: ['create table public.users (id int primary key)'],
      },
    ])
  }
)

withTestDatabase('handles null name and statements', async ({ executeQuery }) => {
  await executeQuery(getCreateMigrationsTableSQL())
  await executeQuery(
    `insert into supabase_migrations.schema_migrations (version) values ('20240303000000')`
  )

  const result = await executeQuery(getMigrationsSql())

  expect(result).toEqual([{ version: '20240303000000', name: null, statements: null }])
})

withTestDatabase(
  'works as the single multi-statement string pg-meta sends (statement_timeout prefix included)',
  async ({ executeQuery }) => {
    // postgres-meta concatenates a statement_timeout prefix and sends the whole
    // thing as one simple-protocol query (a single implicit transaction), which
    // is what lets the transaction-local GUC set in the do-block survive to the
    // trailing select:
    // https://github.com/supabase/postgres-meta/blob/master/src/lib/db.ts
    await executeQuery(getCreateMigrationsTableSQL())
    await executeQuery(
      getInsertMigrationSQL({
        version: '20240101000000',
        name: 'create_users',
        statements: JSON.stringify(['create table public.users (id int primary key)']),
      })
    )

    const result = await executeQuery(
      `SET statement_timeout='10s'; SET idle_session_timeout='10s';${getMigrationsSql()}`
    )

    expect(result).toEqual([
      {
        version: '20240101000000',
        name: 'create_users',
        statements: ['create table public.users (id int primary key)'],
      },
    ])
  }
)

withTestDatabase(
  'does not leak the migrations GUC into the (pooled) session',
  async ({ executeQuery }) => {
    await executeQuery(getCreateMigrationsTableSQL())
    await executeQuery(
      getInsertMigrationSQL({
        version: '20240101000000',
        name: 'create_users',
        statements: JSON.stringify(['create table public.users (id int primary key)']),
      })
    )

    await executeQuery(getMigrationsSql())

    // The pool is capped at one connection, so this runs on the same session.
    // set_config(..., true) is transaction-local: once the query's implicit
    // transaction ends, the migration payload must be gone.
    const [{ value }] = await executeQuery(
      `select current_setting('supabase.studio_migrations', true) as value`
    )
    expect([null, '']).toContain(value)
  }
)

withTestDatabase(
  'tolerates legacy migrations tables with only a version column',
  async ({ executeQuery }) => {
    // Older CLI versions created schema_migrations with a single `version` column
    await executeQuery(`
      create schema if not exists supabase_migrations;
      create table supabase_migrations.schema_migrations (version text not null primary key);
      insert into supabase_migrations.schema_migrations (version) values ('20230101000000');
    `)

    const result = await executeQuery(getMigrationsSql())

    expect(result).toEqual([{ version: '20230101000000', name: null, statements: null }])
  }
)

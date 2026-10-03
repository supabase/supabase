import { afterAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { safeSql } from '../src/pg-format'
import { cleanupRoot, createTestDatabase } from './db/utils'

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

// Regression coverage for the dollar-quote (`$$`) collision in the
// `DO $$ ... $$;` blocks emitted by `pgMeta.tables.update` and
// `pgMeta.columns.update`.
//
// Pre-fix behaviour: the generated DO body contains `ident()`-quoted
// fragments that may include the literal sequence `$$` (for example,
// when a schema/table/column name itself contains `$$`). PostgreSQL
// treats the first unquoted `$$` after the opening `DO $$` as the
// closing delimiter, so a body that contains `$$` is parsed as
// truncated and the statement fails with a syntax error.
//
// Post-fix behaviour: the DO block uses a collision-free delimiter
// derived from the relevant input values, and the update succeeds.

// ---------------------------------------------------------------------------
// pgMeta.tables.update — primary_keys path
// ---------------------------------------------------------------------------

withTestDatabase(
  'tables.update: drop PK on a table whose name contains $$ (DO block delimiter collision)',
  async ({ executeQuery }) => {
    // Create a table whose name contains the literal `$$` sequence.
    await executeQuery(`create table public."weird$$name" (id int primary key, val text);`)

    const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
      name: 'weird$$name',
      schema: 'public',
    })
    const table = zod.parse((await executeQuery(retrieveSql))[0])

    // Updating primary_keys triggers the `DO $$ ... $$;` block whose body
    // embeds the schema and table name via `ident()`. With a `$$` in the
    // table name, the generated SQL previously produced a syntax error
    // when executed.
    const { sql: updateSql } = await pgMeta.tables.update(table!, {
      primary_keys: [],
    })
    await executeQuery(updateSql)

    // Verify the PK was actually dropped (proves the DO block parsed and
    // executed end-to-end, not just that it didn't throw).
    const [{ pk_count }] = await executeQuery<{ pk_count: number }[]>(
      `select count(*)::int as pk_count from pg_constraint where conrelid = 'public."weird$$name"'::regclass and contype = 'p';`
    )
    expect(pk_count).toBe(0)
  }
)

withTestDatabase(
  'tables.update: set PK on a table whose schema contains $$ (DO block delimiter collision)',
  async ({ executeQuery }) => {
    // Schema name contains the literal `$$` sequence.
    await executeQuery(`create schema "App$$x";`)
    await executeQuery(`create table "App$$x"."t" (id int, val text);`)

    const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
      name: 't',
      schema: 'App$$x',
    })
    const table = zod.parse((await executeQuery(retrieveSql))[0])

    const { sql: updateSql } = await pgMeta.tables.update(table!, {
      primary_keys: [{ name: 'id' }],
    })
    await executeQuery(updateSql)

    const [{ pk_count }] = await executeQuery<{ pk_count: number }[]>(
      `select count(*)::int as pk_count from pg_constraint where conrelid = '"App$$x"."t"'::regclass and contype = 'p';`
    )
    expect(pk_count).toBe(1)
  }
)

// ---------------------------------------------------------------------------
// pgMeta.columns.update — is_unique drop path
// ---------------------------------------------------------------------------

withTestDatabase(
  'columns.update: drop UNIQUE on a column whose table name contains $$',
  async ({ executeQuery }) => {
    await executeQuery(`create table public."weird$$tbl" (id int, c int unique);`)

    const { sql: retrieveSql, zod } = await pgMeta.columns.retrieve({
      table: 'weird$$tbl',
      schema: 'public',
      name: 'c',
    })
    const column = zod.parse((await executeQuery(retrieveSql))[0])

    const { sql: updateSql } = await pgMeta.columns.update(column!, {
      is_unique: false,
    })
    await executeQuery(updateSql)

    const [{ uq_count }] = await executeQuery<{ uq_count: number }[]>(
      `select count(*)::int as uq_count from pg_constraint where conrelid = 'public."weird$$tbl"'::regclass and contype = 'u';`
    )
    expect(uq_count).toBe(0)
  }
)

// ---------------------------------------------------------------------------
// pgMeta.columns.update — check constraint drop path
// ---------------------------------------------------------------------------

withTestDatabase(
  'columns.update: replace CHECK on a column whose table name contains $$',
  async ({ executeQuery }) => {
    await executeQuery(`create table public."weird$$tbl2" (id int, c int check (c > 0));`)

    const { sql: retrieveSql, zod } = await pgMeta.columns.retrieve({
      table: 'weird$$tbl2',
      schema: 'public',
      name: 'c',
    })
    const column = zod.parse((await executeQuery(retrieveSql))[0])

    // Replacing the check constraint exercises the `format('ALTER TABLE %I.%I DROP CONSTRAINT %I', ...)`
    // path whose body embeds schema/table via `ident()`. A `$$` in the table
    // name closes the outer DO delimiter early on the pre-fix code path.
    const { sql: updateSql } = await pgMeta.columns.update(column!, {
      check: safeSql`c > -1000`,
    })
    await executeQuery(updateSql)

    const [{ def }] = await executeQuery<{ def: string }[]>(
      `select pg_get_constraintdef(oid) as def from pg_constraint where conrelid = 'public."weird$$tbl2"'::regclass and contype = 'c';`
    )
    expect(def).toContain("'-1000'")
  }
)

withTestDatabase(
  'columns.update: CHECK expression containing $$ does not collide with DO-block delimiter',
  async ({ executeQuery }) => {
    // The CHECK expression itself embeds a `$pg_meta$` literal. The base
    // delimiter is `$pg_meta$`, so the helper must pick `$pg_meta_1$`
    // (or higher) to avoid having the body's own string close the outer
    // DO block early. Pre-fix this fails with `syntax error at or near
    // ...` because the body contains the same delimiter it was opened
    // with.
    await executeQuery(`create table public.check_dollar (id int, c int);`)

    const { sql: retrieveSql, zod } = await pgMeta.columns.retrieve({
      table: 'check_dollar',
      schema: 'public',
      name: 'c',
    })
    const column = zod.parse((await executeQuery(retrieveSql))[0])

    const { sql: updateSql } = await pgMeta.columns.update(column!, {
      // The expression embeds the literal `$pg_meta$` so the helper must
      // skip past the colliding delimiter on its way to `$pg_meta_1$`
      // or higher. We use a benign expression that just exercises the
      // collision path: c > 0 AND a literal-string constant containing
      // the marker text.
      check: safeSql`(c > 0 or '$pg_meta$ marker' is not null)`,
    })
    await executeQuery(updateSql)

    const [{ def }] = await executeQuery<{ def: string }[]>(
      `select pg_get_constraintdef(oid) as def from pg_constraint where conrelid = 'public.check_dollar'::regclass and contype = 'c';`
    )
    expect(def).toContain('$pg_meta$ marker')
  }
)

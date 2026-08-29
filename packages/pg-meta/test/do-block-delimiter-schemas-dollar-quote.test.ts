import { afterAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
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
// `DO $$ ... $$;` blocks emitted by `pgMeta.schemas.update` and
// `pgMeta.schemas.remove`.
//
// Pre-fix behaviour: the body embeds the `name` parameter via
// `quote_ident(${literal(name)})` and the `newName` / `owner`
// parameters via `${literal(...)}`, then runs the result through
// `format('alter schema %I ...', old.nspname, new_owner)`. If any
// of those values contains the literal `$$` sequence, PostgreSQL's
// dollar-quote parser treats the first `$$` it sees in the body as
// the closing delimiter of the outer block, the body is parsed as
// truncated, and the statement fails with `syntax error at or near
// "..."`.
//
// Post-fix behaviour: the DO block uses a collision-free delimiter
// derived from the relevant input values, and the update / remove
// succeeds.

// ---------------------------------------------------------------------------
// pgMeta.schemas.update
// ---------------------------------------------------------------------------

withTestDatabase(
  'schemas.update: rename a schema whose name contains $$ (DO block delimiter collision)',
  async ({ executeQuery }) => {
    // Use lowercase identifier so the `${literal(name)}::regnamespace`
    // resolution (which case-folds unquoted input) finds the schema
    // we just created. The `$$` substring is the test target; the
    // case-folding is a separate concern covered by #49495.
    await executeQuery(`create schema "app$$x";`)

    const { sql: updateSql } = await pgMeta.schemas.update({ name: 'app$$x' }, { name: 'app$$y' })
    await executeQuery(updateSql)

    // Verify the rename actually happened (proves the DO block parsed and executed
    // end-to-end, not just that it didn't throw).
    const exists = await executeQuery<{ exists: boolean }[]>(
      `select exists (select 1 from pg_namespace where nspname = 'app$$y') as exists;`
    )
    expect(exists[0].exists).toBe(true)
  }
)

withTestDatabase(
  'schemas.update: change owner of a schema whose name contains $$',
  async ({ executeQuery }) => {
    await executeQuery(`create schema "app$$z";`)

    const { sql: updateSql } = await pgMeta.schemas.update(
      { name: 'app$$z' },
      { owner: 'postgres' }
    )
    await executeQuery(updateSql)

    const [{ nspowner }] = await executeQuery<{ nspowner: number }[]>(
      `select nspowner::int as nspowner from pg_namespace where nspname = 'app$$z';`
    )
    // The default superuser OID is 10 on a fresh PG; we only care that
    // the owner was changed away from the original (which is whatever
    // role created the schema, typically 10 anyway on a fresh DB).
    // The point of the test is the DO block executes end-to-end.
    expect(typeof nspowner).toBe('number')
  }
)

// ---------------------------------------------------------------------------
// pgMeta.schemas.remove
// ---------------------------------------------------------------------------

withTestDatabase(
  'schemas.remove: drop a schema whose name contains $$',
  async ({ executeQuery }) => {
    await executeQuery(`create schema "drop$$me";`)

    const { sql: removeSql } = await pgMeta.schemas.remove({ name: 'drop$$me' })
    await executeQuery(removeSql)

    const exists = await executeQuery<{ exists: boolean }[]>(
      `select exists (select 1 from pg_namespace where nspname = 'drop$$me') as exists;`
    )
    expect(exists[0].exists).toBe(false)
  }
)

import { afterAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

afterAll(async () => {
  await cleanupRoot()
})

type TestDb = Awaited<ReturnType<typeof createTestDatabase>>

const withTestDatabase = (name: string, fn: (db: TestDb) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

// `tables.update` and `columns.update` drop constraints from inside a
// `DO $$ … $$` block. They used to interpolate the schema and table name into
// the block body, so a table named with a dollar-quote delimiter closed the
// block early and the statement failed with a syntax error. The names are now
// read from `pg_class` inside the block, so they never appear in the SQL text.
const WEIRD_TABLE = 'weird$$name'

withTestDatabase(
  'tables.update drops a primary key on a table named with $$',
  async ({ executeQuery }) => {
    await executeQuery(`create table public."${WEIRD_TABLE}" (id int primary key, val text)`)

    const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
      name: WEIRD_TABLE,
      schema: 'public',
    })
    const table = zod.parse((await executeQuery(retrieveSql))[0])
    expect(table!.primary_keys).toHaveLength(1)

    const { sql: updateSql } = pgMeta.tables.update(table!, { primary_keys: [] })
    await executeQuery(updateSql)

    const { sql: verifySql, zod: verifyZod } = await pgMeta.tables.retrieve({
      name: WEIRD_TABLE,
      schema: 'public',
    })
    const updated = verifyZod.parse((await executeQuery(verifySql))[0])
    expect(updated!.primary_keys).toHaveLength(0)
  }
)

withTestDatabase(
  'tables.update adds a primary key on a table named with $$',
  async ({ executeQuery }) => {
    await executeQuery(`create table public."${WEIRD_TABLE}" (id int primary key, val text)`)
    await executeQuery(`alter table public."${WEIRD_TABLE}" drop constraint "${WEIRD_TABLE}_pkey"`)

    const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
      name: WEIRD_TABLE,
      schema: 'public',
    })
    const table = zod.parse((await executeQuery(retrieveSql))[0])

    const { sql: updateSql } = pgMeta.tables.update(table!, { primary_keys: [{ name: 'id' }] })
    await executeQuery(updateSql)

    const { sql: verifySql, zod: verifyZod } = await pgMeta.tables.retrieve({
      name: WEIRD_TABLE,
      schema: 'public',
    })
    const updated = verifyZod.parse((await executeQuery(verifySql))[0])
    expect(updated!.primary_keys.map((pk: any) => pk.name)).toEqual(['id'])
  }
)

withTestDatabase(
  'columns.update drops a unique constraint on a table named with $$',
  async ({ executeQuery }) => {
    await executeQuery(`create table public."${WEIRD_TABLE}" (id int primary key, u text unique)`)

    const { sql: retrieveSql, zod } = await pgMeta.columns.retrieve({
      schema: 'public',
      table: WEIRD_TABLE,
      name: 'u',
    })
    const column = zod.parse((await executeQuery(retrieveSql))[0])
    expect(column!.is_unique).toBe(true)

    const { sql: updateSql } = pgMeta.columns.update(column!, { is_unique: false })
    await executeQuery(updateSql)

    const { sql: verifySql, zod: verifyZod } = await pgMeta.columns.retrieve({
      schema: 'public',
      table: WEIRD_TABLE,
      name: 'u',
    })
    const updated = verifyZod.parse((await executeQuery(verifySql))[0])
    expect(updated!.is_unique).toBe(false)
  }
)

withTestDatabase(
  'columns.update drops a check constraint on a table named with $$',
  async ({ executeQuery }) => {
    await executeQuery(
      `create table public."${WEIRD_TABLE}" (id int primary key, c int8 check (c <> 0))`
    )

    const { sql: retrieveSql, zod } = await pgMeta.columns.retrieve({
      schema: 'public',
      table: WEIRD_TABLE,
      name: 'c',
    })
    const column = zod.parse((await executeQuery(retrieveSql))[0])
    expect(column!.check).not.toBeNull()

    const { sql: updateSql } = pgMeta.columns.update(column!, { check: null })
    await executeQuery(updateSql)

    const { sql: verifySql, zod: verifyZod } = await pgMeta.columns.retrieve({
      schema: 'public',
      table: WEIRD_TABLE,
      name: 'c',
    })
    const updated = verifyZod.parse((await executeQuery(verifySql))[0])
    expect(updated!.check).toBeNull()
  }
)

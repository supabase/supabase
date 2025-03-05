import { expect, test, beforeAll, afterAll } from 'vitest'
import pgMeta from '../src/index'
import { createTestDatabase, cleanupRoot } from './db/utils'

beforeAll(async () => {
  // Any global setup if needed
})

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

withTestDatabase('list tables', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.tables.list()
  const res = zod.parse(await executeQuery(sql))

  const { columns, primary_keys, relationships, ...rest } = res.find(
    ({ name }) => name === 'users'
  )!

  expect({
    columns: columns!.map(({ id, table_id, ...rest }) => rest),
    primary_keys: primary_keys.map(({ table_id, ...rest }) => rest),
    relationships: relationships.map(({ id, ...rest }) => rest),
    ...rest,
  }).toMatchInlineSnapshot(
    {
      bytes: expect.any(Number),
      dead_rows_estimate: expect.any(Number),
      id: expect.any(Number),
      live_rows_estimate: expect.any(Number),
      size: expect.any(String),
    },
    `
      {
        "bytes": Any<Number>,
        "columns": [
          {
            "check": null,
            "comment": null,
            "data_type": "bigint",
            "default_value": null,
            "enums": [],
            "format": "int8",
            "identity_generation": "BY DEFAULT",
            "is_generated": false,
            "is_identity": true,
            "is_nullable": false,
            "is_unique": false,
            "is_updatable": true,
            "name": "id",
            "ordinal_position": 1,
            "schema": "public",
            "table": "users",
          },
          {
            "check": null,
            "comment": null,
            "data_type": "text",
            "default_value": null,
            "enums": [],
            "format": "text",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "name",
            "ordinal_position": 2,
            "schema": "public",
            "table": "users",
          },
          {
            "check": null,
            "comment": null,
            "data_type": "USER-DEFINED",
            "default_value": "'ACTIVE'::user_status",
            "enums": [
              "ACTIVE",
              "INACTIVE",
            ],
            "format": "user_status",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "status",
            "ordinal_position": 3,
            "schema": "public",
            "table": "users",
          },
        ],
        "comment": null,
        "dead_rows_estimate": Any<Number>,
        "id": Any<Number>,
        "live_rows_estimate": Any<Number>,
        "name": "users",
        "primary_keys": [
          {
            "name": "id",
            "schema": "public",
            "table_name": "users",
          },
        ],
        "relationships": [
          {
            "constraint_name": "todos_user-id_fkey",
            "source_column_name": "user-id",
            "source_schema": "public",
            "source_table_name": "todos",
            "target_column_name": "id",
            "target_table_name": "users",
            "target_table_schema": "public",
          },
          {
            "constraint_name": "user_details_user_id_fkey",
            "source_column_name": "user_id",
            "source_schema": "public",
            "source_table_name": "user_details",
            "target_column_name": "id",
            "target_table_name": "users",
            "target_table_schema": "public",
          },
        ],
        "replica_identity": "DEFAULT",
        "rls_enabled": false,
        "rls_forced": false,
        "schema": "public",
        "size": Any<String>,
      }
    `
  )
})

withTestDatabase('list tables without columns', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.tables.list({ includeColumns: false })
  const res = zod.parse(await executeQuery(sql))

  //@ts-expect-error columns doesn't exist at type level if includeColumns is false
  const { columns, primary_keys, relationships, ...rest } = res.find(
    ({ name }) => name === 'users'
  )!

  expect({
    primary_keys: primary_keys.map(({ table_id, ...rest }) => rest),
    relationships: relationships.map(({ id, ...rest }) => rest),
    ...rest,
  }).toMatchInlineSnapshot(
    {
      bytes: expect.any(Number),
      dead_rows_estimate: expect.any(Number),
      id: expect.any(Number),
      live_rows_estimate: expect.any(Number),
      size: expect.any(String),
    },
    `
      {
        "bytes": Any<Number>,
        "comment": null,
        "dead_rows_estimate": Any<Number>,
        "id": Any<Number>,
        "live_rows_estimate": Any<Number>,
        "name": "users",
        "primary_keys": [
          {
            "name": "id",
            "schema": "public",
            "table_name": "users",
          },
        ],
        "relationships": [
          {
            "constraint_name": "todos_user-id_fkey",
            "source_column_name": "user-id",
            "source_schema": "public",
            "source_table_name": "todos",
            "target_column_name": "id",
            "target_table_name": "users",
            "target_table_schema": "public",
          },
          {
            "constraint_name": "user_details_user_id_fkey",
            "source_column_name": "user_id",
            "source_schema": "public",
            "source_table_name": "user_details",
            "target_column_name": "id",
            "target_table_name": "users",
            "target_table_schema": "public",
          },
        ],
        "replica_identity": "DEFAULT",
        "rls_enabled": false,
        "rls_forced": false,
        "schema": "public",
        "size": Any<String>,
      }
    `
  )
})

withTestDatabase('list tables with included schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.tables.list({
    includedSchemas: ['public'],
  })
  const res = zod.parse(await executeQuery(sql))

  expect(res.length).toBeGreaterThan(0)

  res.forEach((table) => {
    expect(table.schema).toBe('public')
  })
})

withTestDatabase('list tables with excluded schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.tables.list({
    excludedSchemas: ['public'],
  })
  const res = zod.parse(await executeQuery(sql))

  res.forEach((table) => {
    expect(table.schema).not.toBe('public')
  })
})

withTestDatabase(
  'list tables with excluded schemas and include System Schemas',
  async ({ executeQuery }) => {
    const { sql, zod } = await pgMeta.tables.list({
      excludedSchemas: ['public'],
      includeSystemSchemas: true,
    })
    const res = zod.parse(await executeQuery(sql))

    expect(res.length).toBeGreaterThan(0)

    res.forEach((table) => {
      expect(table.schema).not.toBe('public')
    })
  }
)

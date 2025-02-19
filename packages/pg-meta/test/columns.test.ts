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

withTestDatabase('list columns', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.columns.list()
  const res = zod.parse(await executeQuery(sql))

  const userIdColumn = res.find(({ name }) => name === 'user-id')
  expect(userIdColumn).toMatchInlineSnapshot(
    {
      id: expect.stringMatching(/^\d+\.3$/),
      table_id: expect.any(Number),
    },
    `
    {
      "check": null,
      "comment": null,
      "data_type": "bigint",
      "default_value": null,
      "enums": [],
      "format": "int8",
      "id": StringMatching /\\^\\\\d\\+\\\\\\.3\\$/,
      "identity_generation": null,
      "is_generated": false,
      "is_identity": false,
      "is_nullable": false,
      "is_unique": false,
      "is_updatable": true,
      "name": "user-id",
      "ordinal_position": 3,
      "schema": "public",
      "table": "todos",
      "table_id": Any<Number>,
    }
  `
  )
})

withTestDatabase('list columns from a single table', async ({ executeQuery }) => {
  // Create test table
  await executeQuery('CREATE TABLE t (c1 text, c2 text)')

  // Get the table ID directly
  const tableId = Number(
    (
      await executeQuery(
        "SELECT oid FROM pg_class WHERE relname = 't' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
      )
    )[0].oid
  )
  const testTable = { id: tableId, name: 't', schema: 'public' }

  // List columns
  const { sql, zod } = await pgMeta.columns.list({ tableId: testTable.id })
  const res = zod.parse(await executeQuery(sql))

  expect(res).toMatchInlineSnapshot(
    [
      {
        id: expect.stringMatching(/^\d+\.\d+$/),
        table_id: expect.any(Number),
      },
      {
        id: expect.stringMatching(/^\d+\.\d+$/),
        table_id: expect.any(Number),
      },
    ],
    `
    [
      {
        "check": null,
        "comment": null,
        "data_type": "text",
        "default_value": null,
        "enums": [],
        "format": "text",
        "id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
        "identity_generation": null,
        "is_generated": false,
        "is_identity": false,
        "is_nullable": true,
        "is_unique": false,
        "is_updatable": true,
        "name": "c1",
        "ordinal_position": 1,
        "schema": "public",
        "table": "t",
        "table_id": Any<Number>,
      },
      {
        "check": null,
        "comment": null,
        "data_type": "text",
        "default_value": null,
        "enums": [],
        "format": "text",
        "id": StringMatching /\\^\\\\d\\+\\\\\\.\\\\d\\+\\$/,
        "identity_generation": null,
        "is_generated": false,
        "is_identity": false,
        "is_nullable": true,
        "is_unique": false,
        "is_updatable": true,
        "name": "c2",
        "ordinal_position": 2,
        "schema": "public",
        "table": "t",
        "table_id": Any<Number>,
      },
    ]
  `
  )
})

withTestDatabase('list columns with included schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.columns.list({
    includedSchemas: ['public'],
  })
  const res = zod.parse(await executeQuery(sql))

  expect(res.length).toBeGreaterThan(0)
  res.forEach((column) => {
    expect(column.schema).toBe('public')
  })
})

withTestDatabase('list columns with excluded schemas', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.columns.list({
    excludedSchemas: ['public'],
  })
  const res = zod.parse(await executeQuery(sql))

  res.forEach((column) => {
    expect(column.schema).not.toBe('public')
  })
})

withTestDatabase(
  'list columns with excluded schemas and include System Schemas',
  async ({ executeQuery }) => {
    const { sql, zod } = await pgMeta.columns.list({
      excludedSchemas: ['public'],
      includeSystemSchemas: true,
    })
    const res = zod.parse(await executeQuery(sql))

    expect(res.length).toBeGreaterThan(0)
    res.forEach((column) => {
      expect(column.schema).not.toBe('public')
    })
  }
)

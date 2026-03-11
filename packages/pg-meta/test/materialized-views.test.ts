import { afterAll, beforeAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

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

withTestDatabase('list materialized views', async ({ executeQuery }) => {
  const { sql: listSql, zod: listZod } = pgMeta.materializedViews.list()
  const views = listZod.parse(await executeQuery(listSql))
  const todosMaterializedView = views.find(({ name }) => name === 'todos_matview')
  expect(todosMaterializedView).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "columns": [
        {
          "check": null,
          "comment": null,
          "data_type": "bigint",
          "default_value": null,
          "enums": [],
          "format": "int8",
          "id": "16431.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": false,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "todos_matview",
          "table_id": 16431,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "id": "16431.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": false,
          "name": "details",
          "ordinal_position": 2,
          "schema": "public",
          "table": "todos_matview",
          "table_id": 16431,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "bigint",
          "default_value": null,
          "enums": [],
          "format": "int8",
          "id": "16431.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": false,
          "name": "user-id",
          "ordinal_position": 3,
          "schema": "public",
          "table": "todos_matview",
          "table_id": 16431,
        },
      ],
      "comment": null,
      "id": Any<Number>,
      "is_populated": true,
      "name": "todos_matview",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('list materialized views without columns', async ({ executeQuery }) => {
  const { sql: listSql, zod: listZod } = pgMeta.materializedViews.list({ includeColumns: false })
  const views = listZod.parse(await executeQuery(listSql))
  const todosMaterializedView = views.find(({ name }) => name === 'todos_matview')
  expect(todosMaterializedView).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "comment": null,
      "id": Any<Number>,
      "is_populated": true,
      "name": "todos_matview",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('retrieve materialized view by name', async ({ executeQuery }) => {
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.materializedViews.retrieve({
    name: 'todos_matview',
    schema: 'public',
  })
  const view = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(view).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "columns": [
        {
          "check": null,
          "comment": null,
          "data_type": "bigint",
          "default_value": null,
          "enums": [],
          "format": "int8",
          "id": "16431.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": false,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "todos_matview",
          "table_id": 16431,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "id": "16431.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": false,
          "name": "details",
          "ordinal_position": 2,
          "schema": "public",
          "table": "todos_matview",
          "table_id": 16431,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "bigint",
          "default_value": null,
          "enums": [],
          "format": "int8",
          "id": "16431.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": false,
          "name": "user-id",
          "ordinal_position": 3,
          "schema": "public",
          "table": "todos_matview",
          "table_id": 16431,
        },
      ],
      "comment": null,
      "id": Any<Number>,
      "is_populated": true,
      "name": "todos_matview",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('retrieve materialized view by id', async ({ executeQuery }) => {
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.materializedViews.retrieve({
    id: 16431,
  })
  const view = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(view).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
      {
        "columns": [
          {
            "check": null,
            "comment": null,
            "data_type": "bigint",
            "default_value": null,
            "enums": [],
            "format": "int8",
            "id": "16431.1",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": false,
            "name": "id",
            "ordinal_position": 1,
            "schema": "public",
            "table": "todos_matview",
            "table_id": 16431,
          },
          {
            "check": null,
            "comment": null,
            "data_type": "text",
            "default_value": null,
            "enums": [],
            "format": "text",
            "id": "16431.2",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": false,
            "name": "details",
            "ordinal_position": 2,
            "schema": "public",
            "table": "todos_matview",
            "table_id": 16431,
          },
          {
            "check": null,
            "comment": null,
            "data_type": "bigint",
            "default_value": null,
            "enums": [],
            "format": "int8",
            "id": "16431.3",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": false,
            "name": "user-id",
            "ordinal_position": 3,
            "schema": "public",
            "table": "todos_matview",
            "table_id": 16431,
          },
        ],
        "comment": null,
        "id": Any<Number>,
        "is_populated": true,
        "name": "todos_matview",
        "schema": "public",
      }
    `
  )
})

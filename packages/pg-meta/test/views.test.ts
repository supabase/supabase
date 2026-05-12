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

withTestDatabase('list views', async ({ executeQuery }) => {
  const { sql: listSql, zod: listZod } = pgMeta.views.list()
  const views = listZod.parse(await executeQuery(listSql))
  const todosView = views.find(({ name }) => name === 'todos_view')
  expect(todosView).toMatchInlineSnapshot(
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
          "id": "16423.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "todos_view",
          "table_id": 16423,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "id": "16423.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "details",
          "ordinal_position": 2,
          "schema": "public",
          "table": "todos_view",
          "table_id": 16423,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "bigint",
          "default_value": null,
          "enums": [],
          "format": "int8",
          "id": "16423.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "user-id",
          "ordinal_position": 3,
          "schema": "public",
          "table": "todos_view",
          "table_id": 16423,
        },
      ],
      "comment": null,
      "id": Any<Number>,
      "is_updatable": true,
      "name": "todos_view",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('list views without columns', async ({ executeQuery }) => {
  const { sql: listSql, zod: listZod } = pgMeta.views.list({ includeColumns: false })
  const views = listZod.parse(await executeQuery(listSql))
  const todosView = views.find(({ name }) => name === 'todos_view')
  expect(todosView).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "comment": null,
      "id": Any<Number>,
      "is_updatable": true,
      "name": "todos_view",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('retrieve view by name', async ({ executeQuery }) => {
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.views.retrieve({
    name: 'todos_view',
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
          "id": "16423.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "todos_view",
          "table_id": 16423,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "id": "16423.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "details",
          "ordinal_position": 2,
          "schema": "public",
          "table": "todos_view",
          "table_id": 16423,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "bigint",
          "default_value": null,
          "enums": [],
          "format": "int8",
          "id": "16423.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "user-id",
          "ordinal_position": 3,
          "schema": "public",
          "table": "todos_view",
          "table_id": 16423,
        },
      ],
      "comment": null,
      "id": Any<Number>,
      "is_updatable": true,
      "name": "todos_view",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('retrieve view by id', async ({ executeQuery }) => {
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.views.retrieve({
    id: 16423,
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
            "id": "16423.1",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "id",
            "ordinal_position": 1,
            "schema": "public",
            "table": "todos_view",
            "table_id": 16423,
          },
          {
            "check": null,
            "comment": null,
            "data_type": "text",
            "default_value": null,
            "enums": [],
            "format": "text",
            "id": "16423.2",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "details",
            "ordinal_position": 2,
            "schema": "public",
            "table": "todos_view",
            "table_id": 16423,
          },
          {
            "check": null,
            "comment": null,
            "data_type": "bigint",
            "default_value": null,
            "enums": [],
            "format": "int8",
            "id": "16423.3",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": true,
            "is_unique": false,
            "is_updatable": true,
            "name": "user-id",
            "ordinal_position": 3,
            "schema": "public",
            "table": "todos_view",
            "table_id": 16423,
          },
        ],
        "comment": null,
        "id": Any<Number>,
        "is_updatable": true,
        "name": "todos_view",
        "schema": "public",
      }
    `
  )
})

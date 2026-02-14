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

withTestDatabase('list foreign tables', async ({ executeQuery }) => {
  const { sql: listSql, zod: listZod } = pgMeta.foreignTables.list()
  const tables = listZod.parse(await executeQuery(listSql))
  const foreignTable = tables.find(({ name }) => name === 'foreign_table')
  expect(foreignTable).toMatchInlineSnapshot(
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
          "id": "16451.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": false,
          "is_unique": false,
          "is_updatable": true,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "foreign_table",
          "table_id": 16451,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "id": "16451.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "name",
          "ordinal_position": 2,
          "schema": "public",
          "table": "foreign_table",
          "table_id": 16451,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "USER-DEFINED",
          "default_value": null,
          "enums": [
            "ACTIVE",
            "INACTIVE",
          ],
          "format": "user_status",
          "id": "16451.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "status",
          "ordinal_position": 3,
          "schema": "public",
          "table": "foreign_table",
          "table_id": 16451,
        },
      ],
      "comment": null,
      "foreign_data_wrapper_handler": "postgres_fdw_handler",
      "foreign_data_wrapper_name": "postgres_fdw",
      "foreign_server_name": "foreign_server",
      "id": Any<Number>,
      "name": "foreign_table",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('list foreign tables without columns', async ({ executeQuery }) => {
  const { sql: listSql, zod: listZod } = pgMeta.foreignTables.list({ includeColumns: false })
  const tables = listZod.parse(await executeQuery(listSql))
  const foreignTable = tables.find(({ name }) => name === 'foreign_table')
  expect(foreignTable).toMatchInlineSnapshot(
    { id: expect.any(Number) },
    `
    {
      "comment": null,
      "foreign_data_wrapper_handler": "postgres_fdw_handler",
      "foreign_data_wrapper_name": "postgres_fdw",
      "foreign_server_name": "foreign_server",
      "id": Any<Number>,
      "name": "foreign_table",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('retrieve foreign table by name', async ({ executeQuery }) => {
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.foreignTables.retrieve({
    name: 'foreign_table',
    schema: 'public',
  })
  const table = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(table).toMatchInlineSnapshot(
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
          "id": "16451.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": false,
          "is_unique": false,
          "is_updatable": true,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "foreign_table",
          "table_id": 16451,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "id": "16451.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "name",
          "ordinal_position": 2,
          "schema": "public",
          "table": "foreign_table",
          "table_id": 16451,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "USER-DEFINED",
          "default_value": null,
          "enums": [
            "ACTIVE",
            "INACTIVE",
          ],
          "format": "user_status",
          "id": "16451.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "status",
          "ordinal_position": 3,
          "schema": "public",
          "table": "foreign_table",
          "table_id": 16451,
        },
      ],
      "comment": null,
      "foreign_data_wrapper_handler": "postgres_fdw_handler",
      "foreign_data_wrapper_name": "postgres_fdw",
      "foreign_server_name": "foreign_server",
      "id": Any<Number>,
      "name": "foreign_table",
      "schema": "public",
    }
  `
  )
})

withTestDatabase('retrieve foreign table by id', async ({ executeQuery }) => {
  const { sql: retrieveSql, zod: retrieveZod } = pgMeta.foreignTables.retrieve({
    id: 16451,
  })
  const table = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(table).toMatchInlineSnapshot(
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
          "id": "16451.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": false,
          "is_unique": false,
          "is_updatable": true,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "foreign_table",
          "table_id": 16451,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "id": "16451.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "name",
          "ordinal_position": 2,
          "schema": "public",
          "table": "foreign_table",
          "table_id": 16451,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "USER-DEFINED",
          "default_value": null,
          "enums": [
            "ACTIVE",
            "INACTIVE",
          ],
          "format": "user_status",
          "id": "16451.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "status",
          "ordinal_position": 3,
          "schema": "public",
          "table": "foreign_table",
          "table_id": 16451,
        },
      ],
      "comment": null,
      "foreign_data_wrapper_handler": "postgres_fdw_handler",
      "foreign_data_wrapper_name": "postgres_fdw",
      "foreign_server_name": "foreign_server",
      "id": Any<Number>,
      "name": "foreign_table",
      "schema": "public",
    }
  `
  )
})

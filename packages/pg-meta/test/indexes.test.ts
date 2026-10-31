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

withTestDatabase('list indexes', async ({ executeQuery }) => {
  // List indexes
  const { sql: listSql, zod: listZod } = await pgMeta.indexes.list()
  const indexes = listZod.parse(await executeQuery(listSql))
  const usersPkeyIndex = indexes.find(
    ({ index_definition }) =>
      index_definition === 'CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)'
  )!

  expect(usersPkeyIndex).toMatchInlineSnapshot(
    `
    {
      "access_method": "btree",
      "check_xmin": false,
      "class": [
        3124,
      ],
      "collation": [
        0,
      ],
      "comment": null,
      "id": 16399,
      "index_attributes": [
        {
          "attribute_name": "id",
          "attribute_number": 1,
          "data_type": "bigint",
        },
      ],
      "index_definition": "CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)",
      "index_predicate": null,
      "is_clustered": false,
      "is_exclusion": false,
      "is_immediate": true,
      "is_live": true,
      "is_primary": true,
      "is_ready": true,
      "is_replica_identity": false,
      "is_unique": true,
      "is_valid": true,
      "key_attributes": [
        1,
      ],
      "number_of_attributes": 1,
      "number_of_key_attributes": 1,
      "options": [
        0,
      ],
      "schema": "public",
      "table_id": 16393,
    }
  `
  )
})

withTestDatabase('retrieve index', async ({ executeQuery }) => {
  // Retrieve specific index
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.indexes.retrieve({
    id: 16399,
  })
  const index = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(index).toMatchInlineSnapshot(
    `
    {
      "access_method": "btree",
      "check_xmin": false,
      "class": [
        3124,
      ],
      "collation": [
        0,
      ],
      "comment": null,
      "id": 16399,
      "index_attributes": [
        {
          "attribute_name": "id",
          "attribute_number": 1,
          "data_type": "bigint",
        },
      ],
      "index_definition": "CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)",
      "index_predicate": null,
      "is_clustered": false,
      "is_exclusion": false,
      "is_immediate": true,
      "is_live": true,
      "is_primary": true,
      "is_ready": true,
      "is_replica_identity": false,
      "is_unique": true,
      "is_valid": true,
      "key_attributes": [
        1,
      ],
      "number_of_attributes": 1,
      "number_of_key_attributes": 1,
      "options": [
        0,
      ],
      "schema": "public",
      "table_id": 16393,
    }
  `
  )
})

withTestDatabase('list with filters', async ({ executeQuery }) => {
  // Test includeSystemSchemas
  const { sql: withSystemSql, zod } = await pgMeta.indexes.list({ includeSystemSchemas: true })
  const withSystem = zod.parse(await executeQuery(withSystemSql))
  expect(withSystem.some((idx) => idx.schema === 'pg_catalog')).toBe(true)

  // Test without system schemas (default)
  const { sql: withoutSystemSql, zod: withoutSystemZod } = await pgMeta.indexes.list()
  const withoutSystem = withoutSystemZod.parse(await executeQuery(withoutSystemSql))
  expect(withoutSystem.some((idx) => idx.schema === 'pg_catalog')).toBe(false)

  // Test includedSchemas
  const { sql: includedSchemasSql, zod: includedSchemasZod } = await pgMeta.indexes.list({
    includedSchemas: ['public'],
  })
  const includedSchemas = includedSchemasZod.parse(await executeQuery(includedSchemasSql))
  expect(includedSchemas.every((idx) => idx.schema === 'public')).toBe(true)

  // Test excludedSchemas
  const { sql: excludedSchemasSql, zod: excludedSchemasZod } = await pgMeta.indexes.list({
    excludedSchemas: ['public'],
  })
  const excludedSchemas = excludedSchemasZod.parse(await executeQuery(excludedSchemasSql))
  expect(excludedSchemas.some((idx) => idx.schema === 'public')).toBe(false)

  // Test limit and offset
  const { sql: limitSql, zod: limitZod } = await pgMeta.indexes.list({ limit: 1 })
  const limited = limitZod.parse(await executeQuery(limitSql))
  expect(limited).toHaveLength(1)

  const { sql: offsetSql, zod: offsetZod } = await pgMeta.indexes.list({ offset: 1 })
  const offset = offsetZod.parse(await executeQuery(offsetSql))
  expect(offset).toHaveLength(withoutSystem.length - 1)
})

withTestDatabase('handles same index name across schemas correctly', async ({ executeQuery }) => {
  // Create two schemas
  await executeQuery(`CREATE SCHEMA schema_a;`)
  await executeQuery(`CREATE SCHEMA schema_b;`)

  // Create tables
  await executeQuery(`CREATE TABLE schema_a.test (id int);`)
  await executeQuery(`CREATE TABLE schema_b.test (id int);`)

  // Create SAME index name in both schemas
  await executeQuery(`CREATE INDEX idx_test ON schema_a.test (id);`)
  await executeQuery(`CREATE INDEX idx_test ON schema_b.test (id);`)

  // Fetch indexes
  const { sql, zod } = await pgMeta.indexes.list({ includeSystemSchemas: true })
  const indexes = zod.parse(await executeQuery(sql))

  const schemaAIndex = indexes.find(
    (i) => i.schema === 'schema_a' && i.index_definition.includes('schema_a.test')
  )

  const schemaBIndex = indexes.find(
    (i) => i.schema === 'schema_b' && i.index_definition.includes('schema_b.test')
  )

  expect(schemaAIndex).toBeDefined()
  expect(schemaBIndex).toBeDefined()

  expect(schemaAIndex!.index_definition).toContain('schema_a.test')
  expect(schemaBIndex!.index_definition).toContain('schema_b.test')
})

import { expect, test } from 'vitest'
import { pgMeta } from './utils'

const cleanNondet = (x: any) => {
  const {
    data: { columns, primary_keys, relationships, ...rest2 },
    ...rest1
  } = x

  return {
    data: {
      columns: columns.map(({ id, table_id, ...rest }: any) => rest),
      primary_keys: primary_keys.map(({ table_id, ...rest }: any) => rest),
      relationships: relationships.map(({ id, ...rest }: any) => rest),
      ...rest2,
    },
    ...rest1,
  }
}

test('list', async () => {
  const res = await pgMeta.tables.list()

  const { columns, primary_keys, relationships, ...rest }: any = res.data?.find(
    ({ name }) => name === 'users'
  )

  expect({
    columns: columns.map(({ id, table_id, ...rest }: any) => rest),
    primary_keys: primary_keys.map(({ table_id, ...rest }: any) => rest),
    relationships: relationships.map(({ id, ...rest }: any) => rest),
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
        {
          "check": null,
          "comment": null,
          "data_type": "numeric",
          "default_value": null,
          "enums": [],
          "format": "numeric",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "decimal",
          "ordinal_position": 4,
          "schema": "public",
          "table": "users",
        },
        {
          "check": null,
          "comment": null,
          "data_type": "uuid",
          "default_value": "gen_random_uuid()",
          "enums": [],
          "format": "uuid",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "user_uuid",
          "ordinal_position": 5,
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

test('list without columns', async () => {
  const res = await pgMeta.tables.list({ includeColumns: false })

  const { columns, primary_keys, relationships, ...rest }: any = res.data?.find(
    ({ name }) => name === 'users'
  )

  expect({
    primary_keys: primary_keys.map(({ table_id, ...rest }: any) => rest),
    relationships: relationships.map(({ id, ...rest }: any) => rest),
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

test('list tables with included schemas', async () => {
  let res = await pgMeta.tables.list({
    includedSchemas: ['public'],
  })

  expect(res.data?.length).toBeGreaterThan(0)

  res.data?.forEach((table) => {
    expect(table.schema).toBe('public')
  })
})

test('list tables with excluded schemas', async () => {
  let res = await pgMeta.tables.list({
    excludedSchemas: ['public'],
  })

  res.data?.forEach((table) => {
    expect(table.schema).not.toBe('public')
  })
})

test('list tables with excluded schemas and include System Schemas', async () => {
  let res = await pgMeta.tables.list({
    excludedSchemas: ['public'],
    includeSystemSchemas: true,
  })

  expect(res.data?.length).toBeGreaterThan(0)

  res.data?.forEach((table) => {
    expect(table.schema).not.toBe('public')
  })
})

test('retrieve, create, update, delete', async () => {
  let res = await pgMeta.tables.create({ name: 'test', comment: 'foo' })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "bytes": 0,
        "columns": [],
        "comment": "foo",
        "dead_rows_estimate": 0,
        "id": Any<Number>,
        "live_rows_estimate": 0,
        "name": "test",
        "primary_keys": [],
        "relationships": [],
        "replica_identity": "DEFAULT",
        "rls_enabled": false,
        "rls_forced": false,
        "schema": "public",
        "size": "0 bytes",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.tables.retrieve({ id: res.data!.id })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "bytes": 0,
        "columns": [],
        "comment": "foo",
        "dead_rows_estimate": 0,
        "id": Any<Number>,
        "live_rows_estimate": 0,
        "name": "test",
        "primary_keys": [],
        "relationships": [],
        "replica_identity": "DEFAULT",
        "rls_enabled": false,
        "rls_forced": false,
        "schema": "public",
        "size": "0 bytes",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.tables.update(res.data!.id, {
    name: 'test a',
    rls_enabled: true,
    rls_forced: true,
    replica_identity: 'NOTHING',
    comment: 'foo',
  })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "bytes": 0,
        "columns": [],
        "comment": "foo",
        "dead_rows_estimate": 0,
        "id": Any<Number>,
        "live_rows_estimate": 0,
        "name": "test a",
        "primary_keys": [],
        "relationships": [],
        "replica_identity": "NOTHING",
        "rls_enabled": true,
        "rls_forced": true,
        "schema": "public",
        "size": "0 bytes",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.tables.remove(res.data!.id)
  expect(cleanNondet(res)).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "bytes": 0,
        "columns": [],
        "comment": "foo",
        "dead_rows_estimate": 0,
        "id": Any<Number>,
        "live_rows_estimate": 0,
        "name": "test a",
        "primary_keys": [],
        "relationships": [],
        "replica_identity": "NOTHING",
        "rls_enabled": true,
        "rls_forced": true,
        "schema": "public",
        "size": "0 bytes",
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.tables.retrieve({ id: res.data!.id })
  expect(res).toMatchObject({
    data: null,
    error: {
      message: expect.stringMatching(/^Cannot find a table with ID \d+$/),
    },
  })
})

test('update with name unchanged', async () => {
  let res = await pgMeta.tables.create({ name: 't' })
  res = await pgMeta.tables.update(res.data!.id, {
    name: 't',
  })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "bytes": 0,
        "columns": [],
        "comment": null,
        "dead_rows_estimate": 0,
        "id": Any<Number>,
        "live_rows_estimate": 0,
        "name": "t",
        "primary_keys": [],
        "relationships": [],
        "replica_identity": "DEFAULT",
        "rls_enabled": false,
        "rls_forced": false,
        "schema": "public",
        "size": "0 bytes",
      },
      "error": null,
    }
  `
  )
  await pgMeta.tables.remove(res.data!.id)
})

test("allow ' in comments", async () => {
  let res = await pgMeta.tables.create({ name: 't', comment: "'" })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
    { data: { id: expect.any(Number) } },
    `
    {
      "data": {
        "bytes": 0,
        "columns": [],
        "comment": "'",
        "dead_rows_estimate": 0,
        "id": Any<Number>,
        "live_rows_estimate": 0,
        "name": "t",
        "primary_keys": [],
        "relationships": [],
        "replica_identity": "DEFAULT",
        "rls_enabled": false,
        "rls_forced": false,
        "schema": "public",
        "size": "0 bytes",
      },
      "error": null,
    }
  `
  )
  await pgMeta.tables.remove(res.data!.id)
})

test('primary keys', async () => {
  let res = await pgMeta.tables.create({ name: 't' })
  await pgMeta.columns.create({ table_id: res.data!.id, name: 'c', type: 'int8' })
  await pgMeta.columns.create({ table_id: res.data!.id, name: 'cc', type: 'text' })
  res = await pgMeta.tables.update(res.data!.id, {
    primary_keys: [{ name: 'c' }, { name: 'cc' }],
  })
  expect(cleanNondet(res)).toMatchInlineSnapshot(
    {
      data: {
        bytes: expect.any(Number),
        dead_rows_estimate: expect.any(Number),
        id: expect.any(Number),
        live_rows_estimate: expect.any(Number),
        size: expect.any(String),
      },
    },
    `
    {
      "data": {
        "bytes": Any<Number>,
        "columns": [
          {
            "check": null,
            "comment": null,
            "data_type": "bigint",
            "default_value": null,
            "enums": [],
            "format": "int8",
            "identity_generation": null,
            "is_generated": false,
            "is_identity": false,
            "is_nullable": false,
            "is_unique": false,
            "is_updatable": true,
            "name": "c",
            "ordinal_position": 1,
            "schema": "public",
            "table": "t",
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
            "is_nullable": false,
            "is_unique": false,
            "is_updatable": true,
            "name": "cc",
            "ordinal_position": 2,
            "schema": "public",
            "table": "t",
          },
        ],
        "comment": null,
        "dead_rows_estimate": Any<Number>,
        "id": Any<Number>,
        "live_rows_estimate": Any<Number>,
        "name": "t",
        "primary_keys": [
          {
            "name": "c",
            "schema": "public",
            "table_name": "t",
          },
          {
            "name": "cc",
            "schema": "public",
            "table_name": "t",
          },
        ],
        "relationships": [],
        "replica_identity": "DEFAULT",
        "rls_enabled": false,
        "rls_forced": false,
        "schema": "public",
        "size": Any<String>,
      },
      "error": null,
    }
  `
  )
  await pgMeta.tables.remove(res.data!.id)
})

test('retrieve table in non-public schema by id', async () => {
  // Create a custom schema and table
  await pgMeta.query('CREATE SCHEMA IF NOT EXISTS test_schema')
  const createRes = await pgMeta.tables.create({ name: 'test_nonpublic', schema: 'test_schema' })
  const tableId = createRes.data!.id

  // Retrieve by ID (without specifying schema)
  const res = await pgMeta.tables.retrieve({ id: tableId })
  expect(res.error).toBeNull()
  expect(res.data!.name).toBe('test_nonpublic')
  expect(res.data!.schema).toBe('test_schema')

  // Cleanup
  await pgMeta.tables.remove(tableId)
  await pgMeta.query('DROP SCHEMA test_schema')
})

test('composite primary keys preserve order', async () => {
  let res = await pgMeta.tables.create({ name: 't_pk_order' })
  await pgMeta.columns.create({ table_id: res.data!.id, name: 'col_a', type: 'int8' })
  await pgMeta.columns.create({ table_id: res.data!.id, name: 'col_b', type: 'text' })
  await pgMeta.columns.create({ table_id: res.data!.id, name: 'col_c', type: 'int4' })

  // Set primary keys in specific order: col_c, col_a, col_b
  res = await pgMeta.tables.update(res.data!.id, {
    primary_keys: [{ name: 'col_c' }, { name: 'col_a' }, { name: 'col_b' }],
  })

  // Verify the order is preserved
  expect(res.data!.primary_keys.map((pk: any) => pk.name)).toEqual(['col_c', 'col_a', 'col_b'])

  await pgMeta.tables.remove(res.data!.id)
})

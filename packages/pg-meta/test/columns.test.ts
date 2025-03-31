import { test, beforeAll, afterAll, expect } from 'vitest'
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

withTestDatabase('retrieve, create, update, delete column', async ({ executeQuery }) => {
  // Create test table using pure SQL
  await executeQuery('CREATE TABLE t ()')

  // Get table ID
  const tableId = Number(
    (
      await executeQuery(
        "SELECT oid FROM pg_class WHERE relname = 't' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
      )
    )[0].oid
  )

  // Create column
  const { sql: createColumnSql } = await pgMeta.columns.create({
    table_id: tableId,
    name: 'c',
    type: 'int2',
    default_value: 42,
    comment: 'foo',
  })
  await executeQuery(createColumnSql)

  // Retrieve and verify created column
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  let column = retrieveZod.parse((await executeQuery(retrieveSql))[0])
  expect(column).toMatchInlineSnapshot(
    {
      id: expect.stringMatching(/^\d+\.1$/),
      table_id: expect.any(Number),
    },
    `
    {
      "check": null,
      "comment": "foo",
      "data_type": "smallint",
      "default_value": "'42'::smallint",
      "enums": [],
      "format": "int2",
      "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
      "identity_generation": null,
      "is_generated": false,
      "is_identity": false,
      "is_nullable": true,
      "is_unique": false,
      "is_updatable": true,
      "name": "c",
      "ordinal_position": 1,
      "schema": "public",
      "table": "t",
      "table_id": Any<Number>,
    }
  `
  )

  // Update column
  const { sql: updateSql } = await pgMeta.columns.update(column!.id, {
    name: 'c1',
    type: 'int4',
    drop_default: true,
    is_identity: true,
    identity_generation: 'ALWAYS',
    is_nullable: false,
    comment: 'bar',
  })
  await executeQuery(updateSql)

  // Verify updated column
  const { sql: retrieveUpdatedSql, zod: retrieveUpdatedZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c1',
  })
  column = retrieveUpdatedZod.parse((await executeQuery(retrieveUpdatedSql))[0])
  expect(column).toMatchInlineSnapshot(
    {
      id: expect.stringMatching(/^\d+\.1$/),
      table_id: expect.any(Number),
    },
    `
    {
      "check": null,
      "comment": "bar",
      "data_type": "integer",
      "default_value": null,
      "enums": [],
      "format": "int4",
      "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
      "identity_generation": "ALWAYS",
      "is_generated": false,
      "is_identity": true,
      "is_nullable": false,
      "is_unique": false,
      "is_updatable": true,
      "name": "c1",
      "ordinal_position": 1,
      "schema": "public",
      "table": "t",
      "table_id": Any<Number>,
    }
  `
  )

  // Remove column
  const { sql: removeSql } = await pgMeta.columns.remove(column!.id)
  await executeQuery(removeSql)

  // Verify column was removed
  const { sql: retrieveRemovedSql, zod: retrieveRemovedZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c1',
  })
  const removedColumn = retrieveRemovedZod.parse((await executeQuery(retrieveRemovedSql))[0])
  expect(removedColumn).toBeUndefined()
})

withTestDatabase('enum column with quoted name', async ({ executeQuery }) => {
  await executeQuery('CREATE TYPE "T" AS ENUM (\'v\'); CREATE TABLE t ( c "T" );')

  const { sql, zod } = await pgMeta.columns.list()
  const res = zod.parse(await executeQuery(sql))

  expect(res.find(({ table }) => table === 't')).toMatchInlineSnapshot(
    {
      id: expect.stringMatching(/^\d+\.1$/),
      table_id: expect.any(Number),
    },
    `
    {
      "check": null,
      "comment": null,
      "data_type": "USER-DEFINED",
      "default_value": null,
      "enums": [
        "v",
      ],
      "format": "T",
      "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
      "identity_generation": null,
      "is_generated": false,
      "is_identity": false,
      "is_nullable": true,
      "is_unique": false,
      "is_updatable": true,
      "name": "c",
      "ordinal_position": 1,
      "schema": "public",
      "table": "t",
      "table_id": Any<Number>,
    }
  `
  )
})

withTestDatabase('primary key column', async ({ executeQuery }) => {
  // Create test table using pure SQL
  await executeQuery('CREATE TABLE t ()')

  // Get table ID
  const tableId = Number(
    (
      await executeQuery(
        "SELECT oid FROM pg_class WHERE relname = 't' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
      )
    )[0].oid
  )

  // Create column with primary key
  const { sql: createColumnSql } = await pgMeta.columns.create({
    table_id: tableId,
    name: 'c',
    type: 'int2',
    is_primary_key: true,
  })
  await executeQuery(createColumnSql)

  // Verify primary key using pure SQL
  const primaryKeyResult = await executeQuery(`
    SELECT a.attname
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid
                         AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = 't'::regclass
    AND    i.indisprimary;
  `)

  expect(primaryKeyResult).toMatchInlineSnapshot(`
    [
      {
        "attname": "c",
      },
    ]
  `)
})

withTestDatabase('unique column', async ({ executeQuery }) => {
  // Create test table using pure SQL
  await executeQuery('CREATE TABLE t ()')

  // Get table ID
  const tableId = Number(
    (
      await executeQuery(
        "SELECT oid FROM pg_class WHERE relname = 't' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
      )
    )[0].oid
  )

  // Create column with unique constraint
  const { sql: createColumnSql } = await pgMeta.columns.create({
    table_id: tableId,
    name: 'c',
    type: 'int2',
    is_unique: true,
  })
  await executeQuery(createColumnSql)

  // Verify unique constraint using pure SQL
  const uniqueResult = await executeQuery(`
    SELECT a.attname
    FROM   pg_index i
    JOIN   pg_constraint c ON c.conindid = i.indexrelid
    JOIN   pg_attribute a ON a.attrelid = i.indrelid
                        AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = 't'::regclass
    AND    i.indisunique;
  `)

  expect(uniqueResult).toMatchInlineSnapshot(`
    [
      {
        "attname": "c",
      },
    ]
  `)
})

withTestDatabase('array column', async ({ executeQuery }) => {
  // Create test table using pure SQL
  await executeQuery('CREATE TABLE t ()')

  // Get table ID
  const tableId = Number(
    (
      await executeQuery(
        "SELECT oid FROM pg_class WHERE relname = 't' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
      )
    )[0].oid
  )

  // Create array column
  const { sql: createColumnSql } = await pgMeta.columns.create({
    table_id: tableId,
    name: 'c',
    type: 'int2[]',
  })
  await executeQuery(createColumnSql)

  // Retrieve and verify the created column
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  const column = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  expect(column).toMatchInlineSnapshot(
    {
      id: expect.stringMatching(/^\d+\.1$/),
      table_id: expect.any(Number),
    },
    `
    {
      "check": null,
      "comment": null,
      "data_type": "ARRAY",
      "default_value": null,
      "enums": [],
      "format": "_int2",
      "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
      "identity_generation": null,
      "is_generated": false,
      "is_identity": false,
      "is_nullable": true,
      "is_unique": false,
      "is_updatable": true,
      "name": "c",
      "ordinal_position": 1,
      "schema": "public",
      "table": "t",
      "table_id": Any<Number>,
    }
  `
  )
})

withTestDatabase('column with default value', async ({ executeQuery }) => {
  // Create test table using pure SQL
  await executeQuery('CREATE TABLE t ()')

  // Get table ID
  const tableId = Number(
    (
      await executeQuery(
        "SELECT oid FROM pg_class WHERE relname = 't' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
      )
    )[0].oid
  )

  // Create column with default value
  const { sql: createColumnSql } = await pgMeta.columns.create({
    table_id: tableId,
    name: 'c',
    type: 'timestamptz',
    default_value: 'NOW()',
    default_value_format: 'expression',
  })
  await executeQuery(createColumnSql)

  // Retrieve and verify the created column
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  const column = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  expect(column).toMatchInlineSnapshot(
    {
      id: expect.stringMatching(/^\d+\.1$/),
      table_id: expect.any(Number),
    },
    `
    {
      "check": null,
      "comment": null,
      "data_type": "timestamp with time zone",
      "default_value": "now()",
      "enums": [],
      "format": "timestamptz",
      "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
      "identity_generation": null,
      "is_generated": false,
      "is_identity": false,
      "is_nullable": true,
      "is_unique": false,
      "is_updatable": true,
      "name": "c",
      "ordinal_position": 1,
      "schema": "public",
      "table": "t",
      "table_id": Any<Number>,
    }
  `
  )
})

// https://github.com/supabase/supabase/issues/3553
withTestDatabase('alter column to type with uppercase', async ({ executeQuery }) => {
  // Setup: Create table and type
  await executeQuery('CREATE TABLE t ()')
  await executeQuery('CREATE TYPE "T" AS ENUM ()')

  // Get table ID
  const tableId = Number(
    (
      await executeQuery(
        "SELECT oid FROM pg_class WHERE relname = 't' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
      )
    )[0].oid
  )

  // Create and then update column
  const { sql: createSql } = await pgMeta.columns.create({
    table_id: tableId,
    name: 'c',
    type: 'text',
    is_unique: false,
  })
  await executeQuery(createSql)

  // Get column ID
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  const column = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  // Update column
  const { sql: updateSql } = await pgMeta.columns.update(column!.id, { type: 'T' })
  await executeQuery(updateSql)

  // Verify updated column
  const { sql: verifySQL, zod: verifyZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  const updatedColumn = verifyZod.parse((await executeQuery(verifySQL))[0])

  expect(updatedColumn).toMatchInlineSnapshot(
    {
      id: expect.stringMatching(/^\d+\.1$/),
      table_id: expect.any(Number),
    },
    `
    {
      "check": null,
      "comment": null,
      "data_type": "USER-DEFINED",
      "default_value": null,
      "enums": [],
      "format": "T",
      "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
      "identity_generation": null,
      "is_generated": false,
      "is_identity": false,
      "is_nullable": true,
      "is_unique": false,
      "is_updatable": true,
      "name": "c",
      "ordinal_position": 1,
      "schema": "public",
      "table": "t",
      "table_id": Any<Number>,
    }
  `
  )
})

withTestDatabase('enums are populated in enum array columns', async ({ executeQuery }) => {
  // Setup: Create type and table
  await executeQuery(`CREATE TYPE test_enum AS ENUM ('a')`)
  await executeQuery('CREATE TABLE t ()')

  // Get table ID
  const tableId = Number(
    (
      await executeQuery(
        "SELECT oid FROM pg_class WHERE relname = 't' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
      )
    )[0].oid
  )

  // Create column
  const { sql: createSql } = await pgMeta.columns.create({
    table_id: tableId,
    name: 'c',
    type: '_test_enum',
  })
  await executeQuery(createSql)

  // Verify created column
  const { sql: verifySql, zod: verifyZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  const column = verifyZod.parse((await executeQuery(verifySql))[0])

  expect(column).toMatchInlineSnapshot(
    {
      id: expect.stringMatching(/^\d+\.1$/),
      table_id: expect.any(Number),
    },
    `
    {
      "check": null,
      "comment": null,
      "data_type": "ARRAY",
      "default_value": null,
      "enums": [
        "a",
      ],
      "format": "_test_enum",
      "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
      "identity_generation": null,
      "is_generated": false,
      "is_identity": false,
      "is_nullable": true,
      "is_unique": false,
      "is_updatable": true,
      "name": "c",
      "ordinal_position": 1,
      "schema": "public",
      "table": "t",
      "table_id": Any<Number>,
    }
  `
  )
})

withTestDatabase('drop with cascade', async ({ executeQuery }) => {
  // Setup table with generated column
  await executeQuery(`
    create table public.t (
      id int8 primary key,
      t_id int8 generated always as (id) stored
    );
  `)

  // Retrieve column
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'id',
  })
  const column = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  // Remove column with cascade
  const { sql: removeSql } = await pgMeta.columns.remove(column!.id, { cascade: true })
  await executeQuery(removeSql)

  // Verify original column was removed
  const { sql: verifyIdSql, zod: verifyIdZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'id',
  })
  const removedColumn = verifyIdZod.parse((await executeQuery(verifyIdSql))[0])
  expect(removedColumn).toBeUndefined()

  // Verify dependent column was also removed
  const { sql: verifyTIdSql, zod: verifyTIdZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 't_id',
  })
  const dependentColumn = verifyTIdZod.parse((await executeQuery(verifyTIdSql))[0])
  expect(dependentColumn).toBeUndefined()
})

withTestDatabase('column with multiple checks', async ({ executeQuery }) => {
  // Setup table with multiple check constraints
  await executeQuery('create table t(c int8 check (c != 0) check (c != -1))')

  // List columns
  const { sql, zod } = await pgMeta.columns.list()
  const res = zod.parse(await executeQuery(sql))

  const columns = res
    .filter((c) => c.schema === 'public' && c.table === 't')
    .map(({ id, table_id, ...c }) => c)

  expect(columns).toMatchInlineSnapshot(`
    [
      {
        "check": "c <> 0",
        "comment": null,
        "data_type": "bigint",
        "default_value": null,
        "enums": [],
        "format": "int8",
        "identity_generation": null,
        "is_generated": false,
        "is_identity": false,
        "is_nullable": true,
        "is_unique": false,
        "is_updatable": true,
        "name": "c",
        "ordinal_position": 1,
        "schema": "public",
        "table": "t",
      },
    ]
  `)
})

withTestDatabase('column with multiple unique constraints', async ({ executeQuery }) => {
  // Setup table with multiple unique constraints
  await executeQuery(`create table t(c int8 unique); alter table t add unique (c);`)

  // List columns
  const { sql, zod } = await pgMeta.columns.list()
  const res = zod.parse(await executeQuery(sql))

  const columns = res
    .filter((c) => c.schema === 'public' && c.table === 't')
    .map(({ id, table_id, ...c }) => c)

  expect(columns).toMatchInlineSnapshot(`
    [
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
        "is_nullable": true,
        "is_unique": true,
        "is_updatable": true,
        "name": "c",
        "ordinal_position": 1,
        "schema": "public",
        "table": "t",
      },
    ]
  `)
})

withTestDatabase('dropping column checks', async ({ executeQuery }) => {
  // Setup table with check constraint
  await executeQuery(`create table public.t(c int8 check (c != 0))`)

  // Retrieve column
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  const column = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  // Update column to remove check
  const { sql: updateSql } = await pgMeta.columns.update(column!.id, { check: null })
  await executeQuery(updateSql)

  // Verify updated column
  const { sql: verifySql, zod: verifyZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  const updatedColumn = verifyZod.parse((await executeQuery(verifySql))[0])

  expect(updatedColumn!.check).toMatchInlineSnapshot(`null`)
})

withTestDatabase('column with fully-qualified type', async ({ executeQuery }) => {
  // Setup: Create table and type in separate schema
  await executeQuery(`
    create table public.t();
    create schema s;
    create type s.my_type as enum ();
  `)

  // Get table ID using pure SQL
  const tableId = Number(
    (
      await executeQuery(
        "SELECT oid FROM pg_class WHERE relname = 't' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
      )
    )[0].oid
  )

  // Create column with fully-qualified type
  const { sql: createColumnSql } = await pgMeta.columns.create({
    table_id: tableId,
    name: 'c',
    type: 's.my_type',
  })
  await executeQuery(createColumnSql)

  // Retrieve and verify the created column
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  const column = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  expect(column).toMatchInlineSnapshot(
    {
      id: expect.stringMatching(/^\d+\.1$/),
      table_id: expect.any(Number),
    },
    `
    {
      "check": null,
      "comment": null,
      "data_type": "USER-DEFINED",
      "default_value": null,
      "enums": [],
      "format": "my_type",
      "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
      "identity_generation": null,
      "is_generated": false,
      "is_identity": false,
      "is_nullable": true,
      "is_unique": false,
      "is_updatable": true,
      "name": "c",
      "ordinal_position": 1,
      "schema": "public",
      "table": "t",
      "table_id": Any<Number>,
    }
  `
  )
})

import { afterAll, beforeAll, describe, expect, test } from 'vitest'

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

  // Create column
  const { sql: createColumnSql } = await pgMeta.columns.create({
    schema: 'public',
    table: 't',
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
      "default_value": "42",
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
  const { sql: updateSql } = await pgMeta.columns.update(column!, {
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
  const { sql: removeSql } = await pgMeta.columns.remove(column!)
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

  // Create column with primary key
  const { sql: createColumnSql } = await pgMeta.columns.create({
    schema: 'public',
    table: 't',
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

  // Create column with unique constraint
  const { sql: createColumnSql } = await pgMeta.columns.create({
    schema: 'public',
    table: 't',
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

describe('array column', async () => {
  const db = await createTestDatabase()
  await db.executeQuery('CREATE TABLE t ()')

  afterAll(async () => {
    await db.cleanup()
  })

  test.concurrent.for([
    // numerical types
    { type: 'int2[]', etype: '_int2' },
    { type: 'int4[]', etype: '_int4' },
    { type: 'int8[]', etype: '_int8' },
    { type: 'float4[]', etype: '_float4' },
    { type: 'float8[]', etype: '_float8' },
    { type: 'numeric[]', etype: '_numeric' },
    // json types
    { type: 'json[]', etype: '_json' },
    { type: 'jsonb[]', etype: '_jsonb' },
    // text types
    { type: 'text[]', etype: '_text' },
    { type: 'varchar[]', etype: '_varchar' },
    // datetime types
    { type: 'timestamp[]', etype: '_timestamp' },
    { type: 'timestamptz[]', etype: '_timestamptz' },
    { type: 'date[]', etype: '_date' },
    { type: 'time[]', etype: '_time' },
    { type: 'timetz[]', etype: '_timetz' },
    // other types
    { type: 'uuid[]', etype: '_uuid' },
    { type: 'bool[]', etype: '_bool' },
    { type: 'bytea[]', etype: '_bytea' },
  ])('$type -> $etype', async (c, { expect, task }) => {
    const id = { schema: 'public', table: 't', name: `c${task.id}` }

    // Create column with default value
    const { sql } = pgMeta.columns.create({
      ...id,
      type: c.type,
      default_value: null,
    })
    await db.executeQuery(sql)

    // Retrieve and verify the created column
    const expected = pgMeta.columns.retrieve(id)
    const result = await db.executeQuery(expected.sql)
    const column = expected.zod.parse(result[0])

    expect(column).toStrictEqual({
      ...id,
      data_type: 'ARRAY',
      default_value: null,
      format: c.etype,
      id: expect.stringMatching(/^\d+\.\d+$/),
      ordinal_position: expect.any(Number),
      table_id: expect.any(Number),
      check: null,
      comment: null,
      enums: [],
      identity_generation: null,
      is_generated: false,
      is_identity: false,
      is_nullable: true,
      is_unique: false,
      is_updatable: true,
    })
  })
})

describe('column with default value', async () => {
  const db = await createTestDatabase()
  await db.executeQuery('CREATE TABLE t ()')

  afterAll(async () => {
    await db.cleanup()
  })

  test.concurrent.for([
    // numerical types
    { type: 'int2', value: 0, etype: 'smallint', evalue: '0' },
    { type: 'int4', value: 1, etype: 'integer', evalue: '1' },
    { type: 'int8', value: -1, etype: 'bigint', evalue: `'-1'::integer` },
    { type: 'float4', value: 0.1, etype: 'real', evalue: '0.1' },
    { type: 'float8', value: -0.1, etype: 'double precision', evalue: `'-0.1'::numeric` },
    { type: 'numeric', value: 1e2, etype: 'numeric', evalue: '100' },
    // json types
    {
      type: 'json',
      value: { a: 0, b: '1', c: true },
      etype: 'json',
      evalue: `'{\"a\": 0, \"b\": \"1\", \"c\": true}'::jsonb`,
    },
    // json array must be stringified, otherwise it will be converted to pg array literal
    { type: 'jsonb', value: JSON.stringify([null]), etype: 'jsonb', evalue: `'[null]'::jsonb` },
    // text types
    { type: 'text', value: `quote's`, etype: 'text', evalue: `'quote''s'::text` },
    { type: 'varchar', value: '\n', etype: 'character varying', evalue: `'\n'::character varying` },
    // datetime types
    {
      type: 'timestamp',
      value: `now() - INTERVAL '1 day'`,
      etype: 'timestamp without time zone',
      evalue: `(now() - '1 day'::interval)`,
      exp: true,
    },
    {
      type: 'timestamptz',
      value: 'NOW()',
      etype: 'timestamp with time zone',
      evalue: 'now()',
      exp: true,
    },
    { type: 'date', value: '2025-05-09', etype: 'date', evalue: `'2025-05-09'::date` },
    {
      type: 'time',
      value: '11:22:33',
      etype: 'time without time zone',
      evalue: `'11:22:33'::time without time zone`,
    },
    {
      type: 'timetz',
      value: '11:22:33+0800',
      etype: 'time with time zone',
      evalue: `'11:22:33+08'::time with time zone`,
    },
    // other types
    {
      type: 'uuid',
      value: 'gen_random_uuid()',
      etype: 'uuid',
      evalue: 'gen_random_uuid()',
      exp: true,
    },
    { type: 'bool', value: true, etype: 'boolean', evalue: 'true' },
    // https://www.postgresql.org/docs/current/datatype-binary.html#DATATYPE-BINARY-BYTEA-ESCAPE-FORMAT
    { type: 'bytea', value: `\\000`, etype: 'bytea', evalue: `'\\x00'::bytea` },
  ])('$type -> $value', async (c, { expect, task }) => {
    const id = { schema: 'public', table: 't', name: `c${task.id}` }

    // Create column with default value
    const { sql } = pgMeta.columns.create({
      ...id,
      type: c.type,
      default_value: c.value,
      default_value_format: c.exp ? 'expression' : 'literal',
    })
    await db.executeQuery(sql)

    // Retrieve and verify the created column
    const expected = pgMeta.columns.retrieve(id)
    const result = await db.executeQuery(expected.sql)
    const column = expected.zod.parse(result[0])

    expect(column).toStrictEqual({
      ...id,
      data_type: c.etype,
      default_value: c.evalue,
      format: c.type,
      id: expect.stringMatching(/^\d+\.\d+$/),
      ordinal_position: expect.any(Number),
      table_id: expect.any(Number),
      check: null,
      comment: null,
      enums: [],
      identity_generation: null,
      is_generated: false,
      is_identity: false,
      is_nullable: true,
      is_unique: false,
      is_updatable: true,
    })
  })
})

// https://github.com/supabase/supabase/issues/3553
withTestDatabase('alter column to type with uppercase', async ({ executeQuery }) => {
  // Setup: Create table and type
  await executeQuery('CREATE TABLE t ()')
  await executeQuery('CREATE TYPE "T" AS ENUM ()')

  // Create and then update column
  const { sql: createSql } = await pgMeta.columns.create({
    schema: 'public',
    table: 't',
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
  const { sql: updateSql } = await pgMeta.columns.update(column!, { type: 'T' })
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

  // Create column
  const { sql: createSql } = await pgMeta.columns.create({
    schema: 'public',
    table: 't',
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
  const { sql: removeSql } = await pgMeta.columns.remove(column!, { cascade: true })
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
  const { sql: updateSql } = await pgMeta.columns.update(column!, { check: null })
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

  // Create column with fully-qualified type
  const { sql: createColumnSql } = await pgMeta.columns.create({
    schema: 'public',
    table: 't',
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

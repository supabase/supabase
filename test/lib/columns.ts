import { expect, test } from 'vitest'
import { pgMeta } from './utils'

test('list', async () => {
  const res = await pgMeta.columns.list()
  expect(res.data?.find(({ name }) => name === 'user-id')).toMatchInlineSnapshot(
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

test('list from a single table', async () => {
  const { data: testTable }: any = await pgMeta.tables.create({ name: 't' })
  await pgMeta.query('alter table t add c1 text, add c2 text')

  const res = await pgMeta.columns.list({ tableId: testTable!.id })
  expect(res).toMatchInlineSnapshot(
    {
      data: [
        {
          id: expect.stringMatching(/^\d+\.\d+$/),
          table_id: expect.any(Number),
        },

        {
          id: expect.stringMatching(/^\d+\.\d+$/),
          table_id: expect.any(Number),
        },
      ],
    },
    `
    {
      "data": [
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
      ],
      "error": null,
    }
  `
  )

  await pgMeta.tables.remove(testTable!.id)
})

test('list columns with included schemas', async () => {
  let res = await pgMeta.columns.list({
    includedSchemas: ['public'],
  })

  expect(res.data?.length).toBeGreaterThan(0)

  res.data?.forEach((column) => {
    expect(column.schema).toBe('public')
  })
})

test('list columns with excluded schemas', async () => {
  let res = await pgMeta.columns.list({
    excludedSchemas: ['public'],
  })

  res.data?.forEach((column) => {
    expect(column.schema).not.toBe('public')
  })
})

test('list columns with excluded schemas and include System Schemas', async () => {
  let res = await pgMeta.columns.list({
    excludedSchemas: ['public'],
    includeSystemSchemas: true,
  })

  expect(res.data?.length).toBeGreaterThan(0)

  res.data?.forEach((column) => {
    expect(column.schema).not.toBe('public')
  })
})

test('retrieve, create, update, delete', async () => {
  const { data: testTable }: any = await pgMeta.tables.create({ name: 't' })

  let res = await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'int2',
    default_value: 42,
    comment: 'foo',
  })
  expect(res).toMatchInlineSnapshot(
    { data: { id: expect.stringMatching(/^\d+\.1$/), table_id: expect.any(Number) } },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.columns.retrieve({ id: res.data!.id })
  expect(res).toMatchInlineSnapshot(
    {
      data: { id: expect.stringMatching(/^\d+\.1$/), table_id: expect.any(Number) },
    },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.columns.update(res.data!.id, {
    name: 'c1',
    type: 'int4',
    drop_default: true,
    is_identity: true,
    identity_generation: 'ALWAYS',
    is_nullable: false,
    comment: 'bar',
  })
  expect(res).toMatchInlineSnapshot(
    {
      data: { id: expect.stringMatching(/^\d+\.1$/), table_id: expect.any(Number) },
    },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.columns.remove(res.data!.id)
  expect(res).toMatchInlineSnapshot(
    {
      data: { id: expect.stringMatching(/^\d+\.1$/), table_id: expect.any(Number) },
    },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.columns.retrieve({ id: res.data!.id })
  expect(res).toMatchObject({
    data: null,
    error: {
      message: expect.stringMatching(/^Cannot find a column with ID \d+.1$/),
    },
  })

  await pgMeta.tables.remove(testTable!.id)
})

test('enum column with quoted name', async () => {
  await pgMeta.query('CREATE TYPE "T" AS ENUM (\'v\'); CREATE TABLE t ( c "T" );')

  const res = await pgMeta.columns.list()
  expect(res.data!.find(({ table }) => table === 't')).toMatchInlineSnapshot(
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

  await pgMeta.query('DROP TABLE t; DROP TYPE "T";')
})

test('primary key column', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'int2',
    is_primary_key: true,
  })
  const res = await pgMeta.query(`
SELECT a.attname
FROM   pg_index i
JOIN   pg_attribute a ON a.attrelid = i.indrelid
                     AND a.attnum = ANY(i.indkey)
WHERE  i.indrelid = '${testTable!.name}'::regclass
AND    i.indisprimary;
`)
  expect(res).toMatchInlineSnapshot(`
    {
      "data": [
        {
          "attname": "c",
        },
      ],
      "error": null,
    }
  `)

  await pgMeta.tables.remove(testTable!.id)
})

test('unique column', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'int2',
    is_unique: true,
  })
  const res = await pgMeta.query(`
SELECT a.attname
FROM   pg_index i
JOIN   pg_constraint c ON c.conindid = i.indexrelid
JOIN   pg_attribute a ON a.attrelid = i.indrelid
                    AND a.attnum = ANY(i.indkey)
WHERE  i.indrelid = '${testTable!.name}'::regclass
AND    i.indisunique;
`)
  expect(res).toMatchInlineSnapshot(`
    {
      "data": [
        {
          "attname": "c",
        },
      ],
      "error": null,
    }
  `)

  await pgMeta.tables.remove(testTable!.id)
})

test('array column', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  const res = await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'int2[]',
  })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )

  await pgMeta.tables.remove(testTable!.id)
})

test('column with default value', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  const res = await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'timestamptz',
    default_value: 'NOW()',
    default_value_format: 'expression',
  })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )

  await pgMeta.tables.remove(testTable!.id)
})

test('column with constraint', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'text',
    check: "description <> ''",
  })
  const res = await pgMeta.query(`
SELECT pg_get_constraintdef((
  SELECT c.oid
  FROM   pg_constraint c
  WHERE  c.conrelid = '${testTable!.name}'::regclass
));
`)
  expect(res).toMatchInlineSnapshot(`
    {
      "data": [
        {
          "pg_get_constraintdef": null,
        },
      ],
      "error": null,
    }
  `)

  await pgMeta.tables.remove(testTable!.id)
})

test('update with name unchanged', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  let res = await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'int2',
  })
  res = await pgMeta.columns.update(res.data!.id, {
    name: 'c',
  })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
        "check": null,
        "comment": null,
        "data_type": "smallint",
        "default_value": null,
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
      },
      "error": null,
    }
  `
  )

  await pgMeta.tables.remove(testTable!.id)
})

test('update with array types', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  let res = await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'text',
  })
  res = await pgMeta.columns.update(res.data!.id, {
    type: 'text[]',
  })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
        "check": null,
        "comment": null,
        "data_type": "ARRAY",
        "default_value": null,
        "enums": [],
        "format": "_text",
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
      },
      "error": null,
    }
  `
  )

  await pgMeta.tables.remove(testTable!.id)
})

test('update with incompatible types', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  let res = await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'text',
  })
  res = await pgMeta.columns.update(res.data!.id, {
    type: 'int4',
  })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
        "check": null,
        "comment": null,
        "data_type": "integer",
        "default_value": null,
        "enums": [],
        "format": "int4",
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
      },
      "error": null,
    }
  `
  )

  await pgMeta.tables.remove(testTable!.id)
})

test('update is_unique', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  let res = await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'text',
    is_unique: false,
  })
  res = await pgMeta.columns.update(res.data!.id, { is_unique: true })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
        "check": null,
        "comment": null,
        "data_type": "text",
        "default_value": null,
        "enums": [],
        "format": "text",
        "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
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
        "table_id": Any<Number>,
      },
      "error": null,
    }
  `
  )
  res = await pgMeta.columns.update(res.data!.id, { is_unique: false })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
        "check": null,
        "comment": null,
        "data_type": "text",
        "default_value": null,
        "enums": [],
        "format": "text",
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
      },
      "error": null,
    }
  `
  )

  await pgMeta.tables.remove(testTable!.id)
})

// https://github.com/supabase/supabase/issues/3553
test('alter column to type with uppercase', async () => {
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })
  await pgMeta.query('CREATE TYPE "T" AS ENUM ()')

  let res = await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: 'text',
    is_unique: false,
  })
  res = await pgMeta.columns.update(res.data!.id, { type: 'T' })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )

  await pgMeta.tables.remove(testTable!.id)
  await pgMeta.query('DROP TYPE "T"')
})

test('enums are populated in enum array columns', async () => {
  await pgMeta.query(`create type test_enum as enum ('a')`)
  const { data: testTable } = await pgMeta.tables.create({ name: 't' })

  let res = await pgMeta.columns.create({
    table_id: testTable!.id,
    name: 'c',
    type: '_test_enum',
  })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
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
      },
      "error": null,
    }
  `
  )

  await pgMeta.tables.remove(testTable!.id)
  await pgMeta.query(`drop type test_enum`)
})

test('drop with cascade', async () => {
  await pgMeta.query(`
create table public.t (
  id int8 primary key,
  t_id int8 generated always as (id) stored
);
`)

  let res = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'id',
  })
  res = await pgMeta.columns.remove(res.data!.id, { cascade: true })
  expect(res).toMatchInlineSnapshot(
    {
      data: {
        id: expect.stringMatching(/^\d+\.1$/),
        table_id: expect.any(Number),
      },
    },
    `
    {
      "data": {
        "check": null,
        "comment": null,
        "data_type": "bigint",
        "default_value": null,
        "enums": [],
        "format": "int8",
        "id": StringMatching /\\^\\\\d\\+\\\\\\.1\\$/,
        "identity_generation": null,
        "is_generated": false,
        "is_identity": false,
        "is_nullable": false,
        "is_unique": false,
        "is_updatable": true,
        "name": "id",
        "ordinal_position": 1,
        "schema": "public",
        "table": "t",
        "table_id": Any<Number>,
      },
      "error": null,
    }
  `
  )

  res = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 't_id',
  })
  expect(res).toMatchInlineSnapshot(`
    {
      "data": null,
      "error": {
        "message": "Cannot find a column named t_id in table public.t",
      },
    }
  `)

  await pgMeta.query(`drop table public.t;`)
})

test('column with multiple checks', async () => {
  await pgMeta.query(`create table t(c int8 check (c != 0) check (c != -1))`)

  const res = await pgMeta.columns.list()
  const columns = res.data
    ?.filter((c) => c.schema === 'public' && c.table === 't')
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

  await pgMeta.query(`drop table t`)
})

test('column with multiple unique constraints', async () => {
  await pgMeta.query(`create table t(c int8 unique); alter table t add unique (c);`)

  const res = await pgMeta.columns.list()
  const columns = res.data
    ?.filter((c) => c.schema === 'public' && c.table === 't')
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

  await pgMeta.query(`drop table t`)
})

test('dropping column checks', async () => {
  await pgMeta.query(`create table public.t(c int8 check (c != 0))`)

  let res = await pgMeta.columns.retrieve({
    schema: 'public',
    table: 't',
    name: 'c',
  })
  res = await pgMeta.columns.update(res.data!.id, { check: null })
  expect(res?.data?.check).toMatchInlineSnapshot(`null`)

  await pgMeta.query(`drop table t`)
})

test('column with fully-qualified type', async () => {
  await pgMeta.query(`create table public.t(); create schema s; create type s.my_type as enum ();`)

  const table = await pgMeta.tables.retrieve({
    schema: 'public',
    name: 't',
  })
  const { data } = await pgMeta.columns.create({
    table_id: table.data!.id,
    name: 'c',
    type: 's.my_type',
  })
  const { id, table_id, ...column } = data!
  expect(column).toMatchInlineSnapshot(`
    {
      "check": null,
      "comment": null,
      "data_type": "USER-DEFINED",
      "default_value": null,
      "enums": [],
      "format": "my_type",
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
    }
  `)

  await pgMeta.query(`drop table public.t; drop schema s cascade;`)
})

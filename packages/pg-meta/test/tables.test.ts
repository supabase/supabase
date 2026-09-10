import { afterAll, beforeAll, expect, test } from 'vitest'

import pgMeta from '../src/index'
import { cleanupRoot, createTestDatabase } from './db/utils'

beforeAll(async () => {
  // Any global setup if needed
})

afterAll(async () => {
  await cleanupRoot()
})

const cleanNondet = (x: any) => {
  const { columns, primary_keys, relationships, ...rest2 } = x

  return {
    columns: columns.map(({ id, table_id, ...rest }: any) => rest),
    primary_keys: primary_keys.map(({ table_id, ...rest }: any) => rest),
    relationships: relationships.map(({ id, ...rest }: any) => rest),
    ...rest2,
  }
}

type TestDb = Awaited<ReturnType<typeof createTestDatabase>>

const withTestDatabase = (name: string, fn: (db: TestDb) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

// Legacy relationships come out in plan-dependent order (frozen TABLES_SQL has
// no ORDER BY; proven by the adversarial-FK test below), so canonicalize ONLY
// the legacy side to the scoped ORDER BY: constraint_name, then the column names
// (a composite FK expands to one entry per source×target column pair).
const sortRels = (rels: any[]) =>
  [...rels].sort(
    (a, b) =>
      a.constraint_name.localeCompare(b.constraint_name) ||
      a.source_column_name.localeCompare(b.source_column_name) ||
      a.target_column_name.localeCompare(b.target_column_name)
  )

withTestDatabase(
  'scoped tables.retrieve matches legacy (FKs both directions, PK, comment, enums)',
  async ({ executeQuery }) => {
    await executeQuery(`
    create type mood as enum ('sad', 'ok', 'happy');
    create table public.parent (id int primary key, label text);
    create table public.child (
      id int primary key,
      parent_id int references public.parent(id),
      feeling mood,
      self_ref int references public.child(id)
    );
    comment on table public.child is 'a child table';
  `)

    const [{ parent_id }] = await executeQuery<{ parent_id: number }[]>(
      `select 'public.parent'::regclass::oid::int8 as parent_id;`
    )
    const [{ child_id }] = await executeQuery<{ child_id: number }[]>(
      `select 'public.child'::regclass::oid::int8 as child_id;`
    )

    // parent: incoming FK (child.parent_id -> parent.id). child: outgoing FK to
    // parent + a self-referential FK. Cover the id and name+schema branches.
    const cases = [
      {
        label: 'parent by id',
        legacy: { id: Number(parent_id) },
        scoped: { id: Number(parent_id), scoped: true },
      },
      {
        label: 'child by name+schema',
        legacy: { name: 'child', schema: 'public' },
        scoped: { name: 'child', schema: 'public', scoped: true },
      },
      {
        label: 'child by id',
        legacy: { id: Number(child_id) },
        scoped: { id: Number(child_id), scoped: true },
      },
    ] as const

    for (const c of cases) {
      const legacy = pgMeta.tables.retrieve(c.legacy as any)
      const scoped = pgMeta.tables.retrieve(c.scoped as any)
      const legacyRow: any = legacy.zod.parse((await executeQuery(legacy.sql))[0])
      const scopedRow: any = scoped.zod.parse((await executeQuery(scoped.sql))[0])

      // Everything raw except the legacy relationships array, canonicalized to
      // the scoped ORDER BY (legacy order is plan-dependent, see above).
      legacyRow.relationships = sortRels(legacyRow.relationships)
      expect(scopedRow, c.label).toEqual(legacyRow)
      // Scoped's array is already in that order raw (no scoped-side sort).
      expect(scopedRow.relationships, c.label).toEqual(sortRels(scopedRow.relationships))
    }

    // Sanity: the scoped parent retrieve surfaces the INCOMING FK from child.
    const scopedParent = pgMeta.tables.retrieve({ id: Number(parent_id), scoped: true })
    const parentRow: any = scopedParent.zod.parse((await executeQuery(scopedParent.sql))[0])
    expect(
      parentRow.relationships.some(
        (r: any) => r.source_table_name === 'child' && r.target_table_name === 'parent'
      )
    ).toBe(true)
  }
)

// Regression proof for the relationships exception: FK creation order (zzz, aaa,
// mmm) differs from constraint_name order, so legacy's plan order cannot match
// scoped's without the legacy-side sort, while scoped is deterministic by name.
withTestDatabase(
  'scoped tables.retrieve orders relationships by constraint_name (adversarial)',
  async ({ executeQuery }) => {
    await executeQuery(`
      create table public.ref (id int primary key);
      create table public.multi (id int primary key, a int, b int, c int);
      alter table public.multi add constraint zzz_fk foreign key (a) references public.ref (id);
      alter table public.multi add constraint aaa_fk foreign key (b) references public.ref (id);
      alter table public.multi add constraint mmm_fk foreign key (c) references public.ref (id);
    `)
    const legacy = pgMeta.tables.retrieve({ name: 'multi', schema: 'public' })
    const scoped = pgMeta.tables.retrieve({ name: 'multi', schema: 'public', scoped: true })
    const legacyRow: any = legacy.zod.parse((await executeQuery(legacy.sql))[0])
    const scopedRow: any = scoped.zod.parse((await executeQuery(scoped.sql))[0])

    // Scoped is deterministically constraint_name-ordered, raw.
    expect(scopedRow.relationships.map((r: any) => r.constraint_name)).toEqual([
      'aaa_fk',
      'mmm_fk',
      'zzz_fk',
    ])
    // Equal only after canonicalizing the (plan-dependent) legacy side.
    legacyRow.relationships = sortRels(legacyRow.relationships)
    expect(scopedRow).toEqual(legacyRow)
  }
)

// Composite (multi-column) FK: the relationships subquery expands it to one
// entry per source×target column pair, all sharing constraint_name, so the
// scoped ORDER BY tie-breaks on the column names to stay deterministic.
withTestDatabase(
  'scoped tables.retrieve orders composite-FK relationship entries deterministically',
  async ({ executeQuery }) => {
    await executeQuery(`
      create table public.ctgt (x int, y int, primary key (x, y));
      create table public.csrc (a int, b int, foreign key (a, b) references public.ctgt (x, y));
    `)
    const scoped = pgMeta.tables.retrieve({ name: 'csrc', schema: 'public', scoped: true })
    const legacy = pgMeta.tables.retrieve({ name: 'csrc', schema: 'public' })
    const scopedRow: any = scoped.zod.parse((await executeQuery(scoped.sql))[0])
    const legacyRow: any = legacy.zod.parse((await executeQuery(legacy.sql))[0])

    // Four entries (2 source cols × 2 target cols), all one constraint_name.
    expect(scopedRow.relationships).toHaveLength(4)
    expect(new Set(scopedRow.relationships.map((r: any) => r.constraint_name)).size).toBe(1)
    // Scoped is already ordered by (name, source col, target col), raw.
    expect(
      scopedRow.relationships.map((r: any) => [r.source_column_name, r.target_column_name])
    ).toEqual([
      ['a', 'x'],
      ['a', 'y'],
      ['b', 'x'],
      ['b', 'y'],
    ])
    legacyRow.relationships = sortRels(legacyRow.relationships)
    expect(scopedRow).toEqual(legacyRow)
  }
)

withTestDatabase(
  'scoped tables.retrieve preserves composite primary-key column order (indkey, not sorted)',
  async ({ executeQuery }) => {
    // PK declared (b, a) -- index column order is the reverse of alphabetical, so
    // an accidental name-sort would be caught here.
    await executeQuery(
      `create table public.composite_pk (a int not null, b int not null, c int, primary key (b, a));`
    )
    const scoped = pgMeta.tables.retrieve({ name: 'composite_pk', schema: 'public', scoped: true })
    const scopedRow: any = scoped.zod.parse((await executeQuery(scoped.sql))[0])
    // Emitted in index (indkey) order (b, a), the semantically meaningful order.
    expect(scopedRow.primary_keys.map((pk: any) => pk.name)).toEqual(['b', 'a'])

    // Legacy emits the same PK order (the PK aggregate is ordered identically in
    // both renderings), so primary_keys match without any normalization.
    const legacy = pgMeta.tables.retrieve({ name: 'composite_pk', schema: 'public' })
    const legacyRow: any = legacy.zod.parse((await executeQuery(legacy.sql))[0])
    expect(scopedRow.primary_keys).toEqual(legacyRow.primary_keys)
  }
)

/** Original tests ported from postgres-meta */
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
          "format_schema": "pg_catalog",
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
          "format_schema": "pg_catalog",
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
          "format_schema": "public",
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

withTestDatabase('create, retrieve, update, and delete table', async ({ executeQuery }) => {
  // Create table
  const { sql: createSql } = await pgMeta.tables.create({
    name: 'test',
    comment: 'foo',
  })
  await executeQuery(createSql)

  // Retrieve the created table
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.tables.retrieve({
    name: 'test',
    schema: 'public',
  })
  const retrieveRes = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  expect(retrieveRes).toMatchInlineSnapshot(
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
      "columns": [],
      "comment": "foo",
      "dead_rows_estimate": Any<Number>,
      "id": Any<Number>,
      "live_rows_estimate": Any<Number>,
      "name": "test",
      "primary_keys": [],
      "relationships": [],
      "replica_identity": "DEFAULT",
      "rls_enabled": false,
      "rls_forced": false,
      "schema": "public",
      "size": Any<String>,
    }
    `
  )

  // Update table
  const { sql: updateSql } = await pgMeta.tables.update(retrieveRes!, {
    name: 'test a',
    rls_enabled: true,
    rls_forced: true,
    replica_identity: 'NOTHING',
    comment: 'foo',
  })
  await executeQuery(updateSql)

  // Retrieve the updated table
  const { sql: retrieveUpdatedSql, zod: retrieveUpdatedZod } = await pgMeta.tables.retrieve({
    name: 'test a',
    schema: 'public',
  })
  const updateRes = retrieveUpdatedZod.parse((await executeQuery(retrieveUpdatedSql))[0])

  expect(updateRes).toMatchInlineSnapshot(
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
      "columns": [],
      "comment": "foo",
      "dead_rows_estimate": Any<Number>,
      "id": Any<Number>,
      "live_rows_estimate": Any<Number>,
      "name": "test a",
      "primary_keys": [],
      "relationships": [],
      "replica_identity": "NOTHING",
      "rls_enabled": true,
      "rls_forced": true,
      "schema": "public",
      "size": Any<String>,
    }
    `
  )

  // Remove table
  const { sql: removeSql } = await pgMeta.tables.remove(updateRes!)
  await executeQuery(removeSql)

  // Verify table is deleted
  const { sql: verifyDeleteSql } = await pgMeta.tables.retrieve(updateRes!)
  const verifyDeleteRes = await executeQuery(verifyDeleteSql)
  expect(verifyDeleteRes).toHaveLength(0)
})

withTestDatabase('update with name unchanged', async ({ executeQuery }) => {
  // Create table
  const { sql: createSql } = await pgMeta.tables.create({ name: 't' })
  await executeQuery(createSql)

  // Get the created table
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.tables.retrieve({
    name: 't',
    schema: 'public',
  })
  const table = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  // Update table with same name
  const { sql: updateSql } = await pgMeta.tables.update(table!, { name: 't' })
  await executeQuery(updateSql)

  // Verify update
  const { sql: verifySQL, zod: verifyZod } = await pgMeta.tables.retrieve({
    name: 't',
    schema: 'public',
  })
  const res = verifyZod.parse((await executeQuery(verifySQL))[0])

  expect(res).toMatchInlineSnapshot(
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
        "columns": [],
        "comment": null,
        "dead_rows_estimate": Any<Number>,
        "id": Any<Number>,
        "live_rows_estimate": Any<Number>,
        "name": "t",
        "primary_keys": [],
        "relationships": [],
        "replica_identity": "DEFAULT",
        "rls_enabled": false,
        "rls_forced": false,
        "schema": "public",
        "size": Any<String>,
      }
      `
  )
})

withTestDatabase("allow ' in comments", async ({ executeQuery }) => {
  // Create table with single quote in comment
  const { sql: createSql } = await pgMeta.tables.create({
    name: 't',
    comment: "'",
  })
  await executeQuery(createSql)

  // Verify creation
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.tables.retrieve({
    name: 't',
    schema: 'public',
  })
  const res = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  expect(res).toMatchInlineSnapshot(
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
        "columns": [],
        "comment": "'",
        "dead_rows_estimate": Any<Number>,
        "id": Any<Number>,
        "live_rows_estimate": Any<Number>,
        "name": "t",
        "primary_keys": [],
        "relationships": [],
        "replica_identity": "DEFAULT",
        "rls_enabled": false,
        "rls_forced": false,
        "schema": "public",
        "size": Any<String>,
      }
      `
  )
})

withTestDatabase('primary keys', async ({ executeQuery }) => {
  // Create table with columns
  const { sql: createSql } = await pgMeta.tables.create({ name: 't' })
  await executeQuery(createSql)
  await executeQuery(`
    ALTER TABLE t 
    ADD COLUMN c bigint,
    ADD COLUMN cc text
  `)

  // Get the created table
  const { sql: retrieveSql, zod: retrieveZod } = await pgMeta.tables.retrieve({
    name: 't',
    schema: 'public',
  })
  const table = retrieveZod.parse((await executeQuery(retrieveSql))[0])

  // Update table with primary keys
  const { sql: updateSql } = await pgMeta.tables.update(table!, {
    primary_keys: [{ name: 'c' }, { name: 'cc' }],
  })
  await executeQuery(updateSql)

  // Verify update
  const { sql: verifySQL, zod: verifyZod } = await pgMeta.tables.retrieve({
    name: 't',
    schema: 'public',
  })
  const res = verifyZod.parse((await executeQuery(verifySQL))[0])

  expect(cleanNondet(res)).toMatchInlineSnapshot(
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
          "format_schema": "pg_catalog",
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
          "format_schema": "pg_catalog",
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
    }
  `
  )
})

// /** Additional tests */
withTestDatabase('retrieve table by id', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.tables.retrieve({ id: 16510 })
  const res = zod.parse((await executeQuery(sql))[0])

  expect(res).toMatchInlineSnapshot(
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
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "format_schema": "pg_catalog",
          "id": "16510.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": false,
          "is_unique": false,
          "is_updatable": true,
          "name": "name",
          "ordinal_position": 2,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "integer",
          "default_value": null,
          "enums": [],
          "format": "int4",
          "format_schema": "pg_catalog",
          "id": "16510.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "category",
          "ordinal_position": 3,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "jsonb",
          "default_value": null,
          "enums": [],
          "format": "jsonb",
          "format_schema": "pg_catalog",
          "id": "16510.4",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "metadata",
          "ordinal_position": 4,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "timestamp without time zone",
          "default_value": null,
          "enums": [],
          "format": "timestamp",
          "format_schema": "pg_catalog",
          "id": "16510.5",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": false,
          "is_unique": false,
          "is_updatable": true,
          "name": "created_at",
          "ordinal_position": 5,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "integer",
          "default_value": "nextval('memes_id_seq'::regclass)",
          "enums": [],
          "format": "int4",
          "format_schema": "pg_catalog",
          "id": "16510.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": false,
          "is_unique": false,
          "is_updatable": true,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "USER-DEFINED",
          "default_value": "'old'::meme_status",
          "enums": [
            "new",
            "old",
            "retired",
          ],
          "format": "meme_status",
          "format_schema": "public",
          "id": "16510.6",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "status",
          "ordinal_position": 6,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
      ],
      "comment": null,
      "dead_rows_estimate": Any<Number>,
      "id": Any<Number>,
      "live_rows_estimate": Any<Number>,
      "name": "memes",
      "primary_keys": [
        {
          "name": "id",
          "schema": "public",
          "table_id": 16510,
          "table_name": "memes",
        },
      ],
      "relationships": [
        {
          "constraint_name": "memes_category_fkey",
          "id": 16519,
          "source_column_name": "category",
          "source_schema": "public",
          "source_table_name": "memes",
          "target_column_name": "id",
          "target_table_name": "category",
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

withTestDatabase('retrieve table by name and schema', async ({ executeQuery }) => {
  const { sql, zod } = await pgMeta.tables.retrieve({ name: 'memes', schema: 'public' })
  const res = zod.parse((await executeQuery(sql))[0])

  expect(res).toMatchInlineSnapshot(
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
          "data_type": "text",
          "default_value": null,
          "enums": [],
          "format": "text",
          "format_schema": "pg_catalog",
          "id": "16510.2",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": false,
          "is_unique": false,
          "is_updatable": true,
          "name": "name",
          "ordinal_position": 2,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "integer",
          "default_value": null,
          "enums": [],
          "format": "int4",
          "format_schema": "pg_catalog",
          "id": "16510.3",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "category",
          "ordinal_position": 3,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "jsonb",
          "default_value": null,
          "enums": [],
          "format": "jsonb",
          "format_schema": "pg_catalog",
          "id": "16510.4",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "metadata",
          "ordinal_position": 4,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "timestamp without time zone",
          "default_value": null,
          "enums": [],
          "format": "timestamp",
          "format_schema": "pg_catalog",
          "id": "16510.5",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": false,
          "is_unique": false,
          "is_updatable": true,
          "name": "created_at",
          "ordinal_position": 5,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "integer",
          "default_value": "nextval('memes_id_seq'::regclass)",
          "enums": [],
          "format": "int4",
          "format_schema": "pg_catalog",
          "id": "16510.1",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": false,
          "is_unique": false,
          "is_updatable": true,
          "name": "id",
          "ordinal_position": 1,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
        {
          "check": null,
          "comment": null,
          "data_type": "USER-DEFINED",
          "default_value": "'old'::meme_status",
          "enums": [
            "new",
            "old",
            "retired",
          ],
          "format": "meme_status",
          "format_schema": "public",
          "id": "16510.6",
          "identity_generation": null,
          "is_generated": false,
          "is_identity": false,
          "is_nullable": true,
          "is_unique": false,
          "is_updatable": true,
          "name": "status",
          "ordinal_position": 6,
          "schema": "public",
          "table": "memes",
          "table_id": 16510,
        },
      ],
      "comment": null,
      "dead_rows_estimate": Any<Number>,
      "id": Any<Number>,
      "live_rows_estimate": Any<Number>,
      "name": "memes",
      "primary_keys": [
        {
          "name": "id",
          "schema": "public",
          "table_id": 16510,
          "table_name": "memes",
        },
      ],
      "relationships": [
        {
          "constraint_name": "memes_category_fkey",
          "id": 16519,
          "source_column_name": "category",
          "source_schema": "public",
          "source_table_name": "memes",
          "target_column_name": "id",
          "target_table_name": "category",
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

withTestDatabase('retrieve error if missing identifiers', async ({}) => {
  await expect(async () => {
    //@ts-expect-error use with missing params
    await pgMeta.tables.retrieve({ name: 'memes' })
  }).rejects.toThrow('Must provide either id or name and schema')
})

withTestDatabase('remove table by id', async ({ executeQuery }) => {
  // First create a test table
  await executeQuery(`
    CREATE TABLE test_remove_table (
      id SERIAL PRIMARY KEY,
      name TEXT
    );
  `)

  // Get the table's id
  const { sql: listSql, zod: listZod } = await pgMeta.tables.list()
  const tables = listZod.parse(await executeQuery(listSql))
  const tableId = tables.find((t) => t.name === 'test_remove_table')!

  // Remove the table
  const { sql } = await pgMeta.tables.remove(tableId)
  await executeQuery(sql)

  // Verify the table is gone
  const tablesAfter = listZod.parse(await executeQuery(listSql))
  expect(tablesAfter.find((t) => t.name === 'test_remove_table')).toBeUndefined()
})

withTestDatabase('remove table by name and schema', async ({ executeQuery }) => {
  // First create a test table
  await executeQuery(`
    CREATE TABLE test_remove_table_2 (
      id SERIAL PRIMARY KEY,
      name TEXT
    );
  `)

  // Remove the table
  const { sql } = await pgMeta.tables.remove({
    name: 'test_remove_table_2',
    schema: 'public',
  })
  await executeQuery(sql)

  // Verify the table is gone
  const { sql: listSql, zod: listZod } = await pgMeta.tables.list()
  const tables = listZod.parse(await executeQuery(listSql))
  expect(tables.find((t) => t.name === 'test_remove_table_2')).toBeUndefined()
})

withTestDatabase('remove throws error for non-existent table', async ({ executeQuery }) => {
  const { sql } = await pgMeta.tables.remove({
    name: 'non_existent_table',
    schema: 'public',
  })

  // With schema and name
  await expect(executeQuery(sql)).rejects.toThrow(
    `Failed to execute query: table "non_existent_table" does not exist`
  )
})

withTestDatabase('remove throws error with missing identifiers', async ({}) => {
  await expect(async () => {
    //@ts-expect-error use with missing params
    await pgMeta.tables.remove({ name: 'some_table' })
  }).rejects.toThrow('SQL identifier cannot be null or undefined')
})

withTestDatabase('update table - rename', async ({ executeQuery }) => {
  // Create test table
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_rename' })
  await executeQuery(createSql)

  // Update table name
  const { sql: updateSql } = await pgMeta.tables.update(
    { id: 0, name: 'test_rename', schema: 'public' },
    { name: 'test_renamed' }
  )
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_renamed',
    schema: 'public',
  })
  const res = zod.parse((await executeQuery(retrieveSql))[0])
  expect(res!.name).toBe('test_renamed')
})

withTestDatabase('update table - change schema', async ({ executeQuery }) => {
  // Create test schema and table
  await executeQuery('CREATE SCHEMA test_schema')
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_schema_move' })
  await executeQuery(createSql)

  // Move table to new schema
  const { sql: updateSql } = await pgMeta.tables.update(
    { id: 0, name: 'test_schema_move', schema: 'public' },
    { schema: 'test_schema' }
  )
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_schema_move',
    schema: 'test_schema',
  })
  const res = zod.parse((await executeQuery(retrieveSql))[0])
  expect(res!.schema).toBe('test_schema')
})

withTestDatabase('update table - row level security', async ({ executeQuery }) => {
  // Create test table
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_rls' })
  await executeQuery(createSql)

  // Enable RLS
  const { sql: updateSql } = await pgMeta.tables.update(
    { id: 0, name: 'test_rls', schema: 'public' },
    { rls_enabled: true, rls_forced: true }
  )
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_rls',
    schema: 'public',
  })
  const res = zod.parse((await executeQuery(retrieveSql))[0])
  expect(res!.rls_enabled).toBe(true)
  expect(res!.rls_forced).toBe(true)
})

withTestDatabase('update table - replica identity', async ({ executeQuery }) => {
  // Create test table
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_replica' })
  await executeQuery(createSql)

  // Change replica identity
  const { sql: updateSql } = await pgMeta.tables.update(
    { id: 0, name: 'test_replica', schema: 'public' },
    { replica_identity: 'NOTHING' }
  )
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_replica',
    schema: 'public',
  })
  const res = zod.parse((await executeQuery(retrieveSql))[0])
  expect(res!.replica_identity).toBe('NOTHING')
})

withTestDatabase('update table - replica identity INDEX requires index name', async () => {
  expect(() =>
    pgMeta.tables.update({ id: 1, name: 'test', schema: 'public' }, { replica_identity: 'INDEX' })
  ).toThrow('replica_identity_index is required')
})

withTestDatabase('update table - primary keys', async ({ executeQuery }) => {
  // Create test table with a column
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_pk' })
  await executeQuery(createSql)
  await executeQuery('ALTER TABLE test_pk ADD COLUMN id INT')

  // Add primary key
  const { sql: updateSql } = await pgMeta.tables.update(
    { id: 0, name: 'test_pk', schema: 'public' },
    { primary_keys: [{ name: 'id' }] }
  )
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_pk',
    schema: 'public',
  })
  const res = zod.parse((await executeQuery(retrieveSql))[0])
  expect(res!.primary_keys).toHaveLength(1)
  expect(res!.primary_keys[0].name).toBe('id')
})

withTestDatabase('update table - remove primary keys', async ({ executeQuery }) => {
  // Create test table with primary key
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_pk_remove' })
  await executeQuery(createSql)
  await executeQuery('ALTER TABLE test_pk_remove ADD COLUMN id INT PRIMARY KEY')

  const { sql: tableSql, zod: tableZod } = await pgMeta.tables.retrieve({
    name: 'test_pk_remove',
    schema: 'public',
  })
  const table = tableZod.parse((await executeQuery(tableSql))[0])

  // Remove primary key
  const { sql: updateSql } = await pgMeta.tables.update(table!, { primary_keys: [] })
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_pk_remove',
    schema: 'public',
  })
  const res = zod.parse((await executeQuery(retrieveSql))[0])
  expect(res!.primary_keys).toHaveLength(0)
})

withTestDatabase('update table - comment', async ({ executeQuery }) => {
  // Create test table
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_comment' })
  await executeQuery(createSql)

  // Add comment
  const { sql: updateSql } = await pgMeta.tables.update(
    { id: 0, name: 'test_comment', schema: 'public' },
    { comment: 'Test comment' }
  )
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_comment',
    schema: 'public',
  })
  const res = zod.parse((await executeQuery(retrieveSql))[0])
  expect(res!.comment).toBe('Test comment')
})

withTestDatabase('update table - multiple changes', async ({ executeQuery }) => {
  // Create test table
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_multiple' })
  await executeQuery(createSql)
  await executeQuery('ALTER TABLE test_multiple ADD COLUMN id INT')

  // Make multiple changes
  const { sql: updateSql } = await pgMeta.tables.update(
    { id: 0, name: 'test_multiple', schema: 'public' },
    {
      name: 'test_multiple_updated',
      comment: 'Updated table',
      rls_enabled: true,
      primary_keys: [{ name: 'id' }],
      replica_identity: 'FULL',
    }
  )
  await executeQuery(updateSql)

  // Verify all updates
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_multiple_updated',
    schema: 'public',
  })
  const res = zod.parse((await executeQuery(retrieveSql))[0])
  expect(res).toMatchObject({
    name: 'test_multiple_updated',
    comment: 'Updated table',
    rls_enabled: true,
    replica_identity: 'FULL',
    primary_keys: [expect.objectContaining({ name: 'id' })],
  })
})

withTestDatabase('update table - by id', async ({ executeQuery }) => {
  // Create test table
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_by_id' })
  await executeQuery(createSql)

  // Get table id
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_by_id',
    schema: 'public',
  })
  const table = zod.parse((await executeQuery(retrieveSql))[0])

  // Update by id
  const { sql: updateSql } = await pgMeta.tables.update(table!, { name: 'test_by_id_updated' })
  await executeQuery(updateSql)

  // Verify update
  const { sql: verifySQL, zod: verifyZod } = await pgMeta.tables.retrieve({
    name: 'test_by_id_updated',
    schema: 'public',
  })
  const res = verifyZod.parse((await executeQuery(verifySQL))[0])
  expect(res!.name).toBe('test_by_id_updated')
})

withTestDatabase('update table - error on non-existent table', async ({ executeQuery }) => {
  const { sql: updateSql } = await pgMeta.tables.update(
    { id: 0, name: 'non_existent', schema: 'public' },
    { name: 'new_name' }
  )

  await expect(executeQuery(updateSql)).rejects.toThrow()
})

withTestDatabase('update table - rename with schema change', async ({ executeQuery }) => {
  // Create test schema and table
  await executeQuery('CREATE SCHEMA test_schema')
  const { sql: createSql } = await pgMeta.tables.create({ name: 'test_rename_schema' })
  await executeQuery(createSql)

  // Update both name and schema
  const { sql: updateSql } = await pgMeta.tables.update(
    { id: 0, name: 'test_rename_schema', schema: 'public' },
    {
      name: 'test_renamed_schema',
      schema: 'test_schema',
    }
  )
  await executeQuery(updateSql)

  // Verify update
  const { sql: retrieveSql, zod } = await pgMeta.tables.retrieve({
    name: 'test_renamed_schema',
    schema: 'test_schema',
  })
  const res = zod.parse((await executeQuery(retrieveSql))[0])
  expect(res!.name).toBe('test_renamed_schema')
  expect(res!.schema).toBe('test_schema')
})

// Table creation test cases
const tableCreationTests = [
  {
    name: 'create table with default schema',
    input: {
      name: 'test_table_1',
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
  {
    name: 'create table with explicit public schema',
    input: {
      name: 'test_table_2',
      schema: 'public',
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
  {
    name: 'create table with custom schema',
    input: {
      name: 'test_table_3',
      schema: 'custom_schema',
    },
    expectedSchema: 'custom_schema',
    expectedComment: null,
    beforeTest: async (
      executeQuery: Awaited<ReturnType<typeof createTestDatabase>>['executeQuery']
    ) => {
      await executeQuery('CREATE SCHEMA IF NOT EXISTS custom_schema')
    },
  },
  {
    name: 'create table with comment',
    input: {
      name: 'test_table_4',
      comment: 'Test comment',
    },
    expectedSchema: 'public',
    expectedComment: 'Test comment',
  },
  {
    name: 'create table with empty string comment',
    input: {
      name: 'test_table_5',
      comment: '',
    },
    expectedSchema: 'public',
    expectedComment: null, // PostgreSQL treats empty string comments as NULL
  },
  {
    name: 'create table with null comment',
    input: {
      name: 'test_table_6',
      comment: null,
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
  {
    name: 'create table with uppercase name',
    input: {
      name: 'UPPERCASE_TABLE',
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
  {
    name: 'create table with mixed case name',
    input: {
      name: 'MixedCase_Table_Name',
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
  {
    name: 'create table with quoted name',
    input: {
      name: 'table "with" quotes',
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
  {
    name: 'create table with special characters',
    input: {
      name: 'table$with#special@chars',
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
  {
    name: 'create table with name at maximum length',
    input: {
      name: 'a'.repeat(63), // PostgreSQL has a 63-byte limit for identifiers
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
  {
    name: 'create table with schema containing special characters',
    input: {
      name: 'normal_table',
      schema: 'Special.Schema$Name',
    },
    expectedSchema: 'Special.Schema$Name',
    expectedComment: null,
    beforeTest: async (executeQuery: TestDb['executeQuery']) => {
      await executeQuery('CREATE SCHEMA IF NOT EXISTS "Special.Schema$Name"')
    },
  },
  {
    name: 'create table with very long name',
    input: {
      name: 'a'.repeat(63),
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
  {
    name: 'create table with special characters in name',
    input: {
      name: 'table,name',
    },
    expectedSchema: 'public',
    expectedComment: null,
  },
]

// SQL injection test cases
const sqlInjectionTests = [
  {
    name: 'prevent SQL injection in table name',
    input: {
      name: "table_name'; DROP TABLE users; --",
    },
  },
  {
    name: 'prevent SQL injection in comment',
    input: {
      name: 'safe_table',
      comment: "normal comment'; DROP TABLE users; --",
    },
  },
]

// Error test cases
const errorTests = [
  {
    name: 'fail on duplicate table name',
    input: { name: 'duplicate_table' },
    setup: async (executeQuery: TestDb['executeQuery']) => {
      await executeQuery(pgMeta.tables.create({ name: 'duplicate_table' }).sql)
    },
    expectedError: /relation.*already exists/,
  },
  {
    name: 'fail on invalid schema',
    input: { name: 'test_table', schema: 'nonexistent_schema' },
    expectedError: /schema.*does not exist/,
  },
  {
    name: 'fail on empty table name',
    input: {
      name: '',
    },
    expectedError: /zero-length delimited identifier/,
  },
  {
    name: 'fail on schema name exceeding maximum length',
    input: {
      name: 'table',
      schema: 'a'.repeat(64),
    },
    expectedError: /schema.*does not exist/,
  },
]

// Generate individual test cases for successful table creation
for (const testCase of tableCreationTests) {
  withTestDatabase(testCase.name, async ({ executeQuery }) => {
    if (testCase.beforeTest) {
      await testCase.beforeTest(executeQuery)
    }

    const { sql } = pgMeta.tables.create(testCase.input)
    await executeQuery(sql)

    const { sql: listSql, zod: listZod } = await pgMeta.tables.list()
    const tables = listZod.parse(await executeQuery(listSql))
    const createdTable = tables.find((t) => t.name === testCase.input.name)

    expect(createdTable).toBeDefined()
    expect(createdTable?.schema).toBe(testCase.expectedSchema)
    expect(createdTable?.comment).toBe(testCase.expectedComment)
  })
}

// Generate individual test cases for SQL injection prevention
for (const testCase of sqlInjectionTests) {
  withTestDatabase(`create - ${testCase.name}`, async ({ executeQuery }) => {
    const { sql } = pgMeta.tables.create(testCase.input)
    await executeQuery(sql)

    // Verify table was created with correct name
    const { sql: listSql, zod: listZod } = await pgMeta.tables.list()
    const tables = listZod.parse(await executeQuery(listSql))
    expect(tables.find((t) => t.name === testCase.input.name)).toBeDefined()

    // Verify users table still exists (wasn't dropped)
    expect(tables.find((t) => t.name === 'users')).toBeDefined()
  })
}

// Generate individual test cases for error conditions
for (const testCase of errorTests) {
  withTestDatabase(`create - ${testCase.name}`, async ({ executeQuery }) => {
    if (testCase.setup) {
      await testCase.setup(executeQuery)
    }

    const { sql } = pgMeta.tables.create(testCase.input)
    await expect(executeQuery(sql)).rejects.toThrow(testCase.expectedError)
  })
}

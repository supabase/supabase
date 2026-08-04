import { afterAll, expect, test } from 'vitest'

import pgMeta, { getTablesPaginatedSql } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

type Row = {
  id: number
  schema: string
  name: string
  rls_enabled: boolean
  rls_forced: boolean
  replica_identity: string
  bytes: number
  size: string
  live_rows_estimate: number
  dead_rows_estimate: number
  comment: string | null
  primary_keys: Array<{ table_id: number; schema: string; table_name: string; name: string }>
  relationships: Array<{
    id: number
    constraint_name: string
    source_schema: string
    source_table_name: string
    source_column_name: string
    target_table_schema: string
    target_table_name: string
    target_column_name: string
  }>
  columns?: Array<{ table_id: number; name: string }>
}

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

withTestDatabase('returns public tables ordered by oid', async ({ executeQuery }) => {
  const sql = getTablesPaginatedSql({ schema: 'public', limit: 100, afterOid: 0 })
  const rows = await executeQuery<Row[]>(sql)

  expect(rows.length).toBeGreaterThan(0)
  // Every row is in `public`
  expect(rows.every((r) => r.schema === 'public')).toBe(true)
  // Strictly increasing OIDs
  for (let i = 1; i < rows.length; i++) {
    expect(rows[i].id).toBeGreaterThan(rows[i - 1].id)
  }
  // Seed contains these base tables
  const names = rows.map((r) => r.name)
  for (const expected of ['users', 'todos', 'user_details', 'category', 'memes']) {
    expect(names).toContain(expected)
  }
  // Views / materialized views excluded (relkind filter)
  expect(names).not.toContain('todos_view')
  expect(names).not.toContain('todos_matview')
})

withTestDatabase(
  'excludes system schemas when no schema filter given',
  async ({ executeQuery }) => {
    const sql = getTablesPaginatedSql({ limit: 500, afterOid: 0 })
    const rows = await executeQuery<Row[]>(sql)

    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(r.schema).not.toBe('pg_catalog')
      expect(r.schema).not.toBe('information_schema')
      expect(r.schema).not.toBe('pg_toast')
    }
  }
)

withTestDatabase('cursor pagination has no overlap and no gap', async ({ executeQuery }) => {
  // Fetch the full list first as ground truth.
  const fullSql = getTablesPaginatedSql({ schema: 'public', limit: 1000, afterOid: 0 })
  const all = await executeQuery<Row[]>(fullSql)
  expect(all.length).toBeGreaterThanOrEqual(4)

  // Walk pages of size 3 using cursor pagination, collect all rows, compare.
  const pageSize = 3
  const collected: Row[] = []
  let cursor = 0
  // Safety bound — far more pages than the seed could ever produce.
  for (let i = 0; i < 50; i++) {
    const pageSql = getTablesPaginatedSql({
      schema: 'public',
      limit: pageSize,
      afterOid: cursor,
    })
    const page = await executeQuery<Row[]>(pageSql)
    collected.push(...page)
    if (page.length < pageSize) break
    cursor = page[page.length - 1].id
  }

  expect(collected.map((r) => r.id)).toEqual(all.map((r) => r.id))
})

withTestDatabase('short last page signals end of pagination', async ({ executeQuery }) => {
  const fullSql = getTablesPaginatedSql({ schema: 'public', limit: 1000, afterOid: 0 })
  const all = await executeQuery<Row[]>(fullSql)

  // Choose a page size strictly larger than the dataset so the first page is
  // necessarily the last page.
  const pageSize = all.length + 5
  const sql = getTablesPaginatedSql({ schema: 'public', limit: pageSize, afterOid: 0 })
  const page = await executeQuery<Row[]>(sql)

  expect(page.length).toBeLessThan(pageSize)
  expect(page.length).toBe(all.length)
})

withTestDatabase('schema filter restricts to the requested schema', async ({ executeQuery }) => {
  await executeQuery(`
    create schema if not exists other_schema;
    create table other_schema.widgets (id bigint primary key);
  `)

  const publicSql = getTablesPaginatedSql({ schema: 'public', limit: 500, afterOid: 0 })
  const publicRows = await executeQuery<Row[]>(publicSql)
  expect(publicRows.every((r) => r.schema === 'public')).toBe(true)
  expect(publicRows.map((r) => r.name)).not.toContain('widgets')

  const otherSql = getTablesPaginatedSql({ schema: 'other_schema', limit: 500, afterOid: 0 })
  const otherRows = await executeQuery<Row[]>(otherSql)
  expect(otherRows.map((r) => ({ schema: r.schema, name: r.name }))).toEqual([
    { schema: 'other_schema', name: 'widgets' },
  ])
})

withTestDatabase('primary keys are populated per table', async ({ executeQuery }) => {
  const sql = getTablesPaginatedSql({ schema: 'public', limit: 100, afterOid: 0 })
  const rows = await executeQuery<Row[]>(sql)

  const users = rows.find((r) => r.name === 'users')!
  expect(users.primary_keys).toEqual([
    { table_id: users.id, schema: 'public', table_name: 'users', name: 'id' },
  ])

  // users_audit has no primary key in the seed.
  const usersAudit = rows.find((r) => r.name === 'users_audit')!
  expect(usersAudit.primary_keys).toEqual([])
})

withTestDatabase(
  'composite FK pairs source and target columns by ordinal position',
  async ({ executeQuery }) => {
    // A composite FK with N columns must produce exactly N relationship rows,
    // each pairing source column k with target column k. The naive
    // `attnum = any(conkey)` + `attnum = any(confkey)` shape produces an N*N
    // cross-product with mismatched pairings.
    await executeQuery(`
      create table public.composite_parent (
        a int,
        b int,
        primary key (a, b)
      );
      create table public.composite_child (
        id bigint primary key,
        pa int not null,
        pb int not null,
        foreign key (pa, pb) references public.composite_parent (a, b)
      );
    `)

    const sql = getTablesPaginatedSql({ schema: 'public', limit: 500, afterOid: 0 })
    const rows = await executeQuery<Row[]>(sql)

    const child = rows.find((r) => r.name === 'composite_child')!
    const childRels = child.relationships.filter((r) => r.target_table_name === 'composite_parent')

    expect(childRels).toHaveLength(2)
    expect(childRels).toContainEqual(
      expect.objectContaining({
        source_table_name: 'composite_child',
        source_column_name: 'pa',
        target_table_name: 'composite_parent',
        target_column_name: 'a',
      })
    )
    expect(childRels).toContainEqual(
      expect.objectContaining({
        source_table_name: 'composite_child',
        source_column_name: 'pb',
        target_table_name: 'composite_parent',
        target_column_name: 'b',
      })
    )
    // No cross-product pairings.
    expect(childRels).not.toContainEqual(
      expect.objectContaining({ source_column_name: 'pa', target_column_name: 'b' })
    )
    expect(childRels).not.toContainEqual(
      expect.objectContaining({ source_column_name: 'pb', target_column_name: 'a' })
    )

    // The parent side (target-arm of the UNION) must also pair correctly.
    const parent = rows.find((r) => r.name === 'composite_parent')!
    const parentRels = parent.relationships.filter((r) => r.source_table_name === 'composite_child')
    expect(parentRels).toHaveLength(2)
    expect(parentRels).toContainEqual(
      expect.objectContaining({ source_column_name: 'pa', target_column_name: 'a' })
    )
    expect(parentRels).toContainEqual(
      expect.objectContaining({ source_column_name: 'pb', target_column_name: 'b' })
    )
  }
)

withTestDatabase(
  'relationships populate both source and target sides',
  async ({ executeQuery }) => {
    const sql = getTablesPaginatedSql({ schema: 'public', limit: 100, afterOid: 0 })
    const rows = await executeQuery<Row[]>(sql)

    // `todos."user-id"` references `users.id` — show up on both sides.
    const todos = rows.find((r) => r.name === 'todos')!
    expect(todos.relationships).toContainEqual(
      expect.objectContaining({
        source_table_name: 'todos',
        source_column_name: 'user-id',
        target_table_name: 'users',
        target_column_name: 'id',
      })
    )

    const users = rows.find((r) => r.name === 'users')!
    expect(users.relationships).toContainEqual(
      expect.objectContaining({
        source_table_name: 'todos',
        target_table_name: 'users',
      })
    )

    // Tables without FKs should still have an empty array, not null.
    const empty = rows.find((r) => r.name === 'empty')!
    expect(empty.relationships).toEqual([])
  }
)

withTestDatabase('includeColumns: false omits the columns field', async ({ executeQuery }) => {
  const sql = getTablesPaginatedSql({
    schema: 'public',
    limit: 10,
    afterOid: 0,
    includeColumns: false,
  })
  const rows = await executeQuery<Row[]>(sql)

  expect(rows.length).toBeGreaterThan(0)
  for (const r of rows) {
    expect(r).not.toHaveProperty('columns')
  }
})

withTestDatabase('includeColumns: true returns columns per row', async ({ executeQuery }) => {
  const sql = getTablesPaginatedSql({
    schema: 'public',
    limit: 100,
    afterOid: 0,
    includeColumns: true,
  })
  const rows = await executeQuery<Row[]>(sql)

  const users = rows.find((r) => r.name === 'users')!
  expect(Array.isArray(users.columns)).toBe(true)
  const columnNames = users.columns!.map((c) => c.name).sort()
  expect(columnNames).toEqual(['id', 'name', 'status'])
  // Columns are scoped to the table.
  expect(users.columns!.every((c) => c.table_id === users.id)).toBe(true)

  // Tables without columns return an empty array, not null.
  const empty = rows.find((r) => r.name === 'empty')!
  expect(empty.columns).toEqual([])
})

withTestDatabase(
  'nameFilter restricts results to tables whose name matches (case-insensitive)',
  async ({ executeQuery }) => {
    await executeQuery(`
      create table public.users_archive_2024 (id bigint primary key);
      create table public.users_archive_2025 (id bigint primary key);
    `)

    const sql = getTablesPaginatedSql({
      schema: 'public',
      limit: 100,
      afterOid: 0,
      nameFilter: 'USERS_ARCHIVE',
    })
    const rows = await executeQuery<Row[]>(sql)
    const names = rows.map((r) => r.name).sort()
    expect(names).toEqual(['users_archive_2024', 'users_archive_2025'])
  }
)

withTestDatabase(
  'nameFilter matches fully-qualified schema.table names when no schema filter is set',
  async ({ executeQuery }) => {
    await executeQuery(`
      create schema if not exists cmdk_regression;
      create table cmdk_regression.repro_table (id bigint primary key);
    `)

    const baseSql = getTablesPaginatedSql({
      limit: 100,
      afterOid: 0,
      nameFilter: 'cmdk_regression.repro_table',
    })
    const baseRows = await executeQuery<Row[]>(baseSql)

    expect(baseRows.map((r) => ({ schema: r.schema, name: r.name }))).toContainEqual({
      schema: 'cmdk_regression',
      name: 'repro_table',
    })

    const withColumnsSql = getTablesPaginatedSql({
      limit: 100,
      afterOid: 0,
      includeColumns: true,
      nameFilter: 'cmdk_regression.repro_table',
    })
    const withColumnsRows = await executeQuery<Row[]>(withColumnsSql)

    expect(withColumnsRows.map((r) => ({ schema: r.schema, name: r.name }))).toContainEqual({
      schema: 'cmdk_regression',
      name: 'repro_table',
    })
  }
)

withTestDatabase(
  'nameFilter escapes LIKE wildcards so they match literally',
  async ({ executeQuery }) => {
    await executeQuery(`
      create table public."weird_name" (id bigint primary key);
      create table public."weird%name" (id bigint primary key);
    `)

    const sql = getTablesPaginatedSql({
      schema: 'public',
      limit: 100,
      afterOid: 0,
      nameFilter: 'weird%',
    })
    const rows = await executeQuery<Row[]>(sql)
    const names = rows.map((r) => r.name)
    // Only the table with a literal `%` in its name should match.
    expect(names).toContain('weird%name')
    expect(names).not.toContain('weird_name')
  }
)

withTestDatabase('afterOid skips tables with smaller oids', async ({ executeQuery }) => {
  const fullSql = getTablesPaginatedSql({ schema: 'public', limit: 1000, afterOid: 0 })
  const all = await executeQuery<Row[]>(fullSql)
  expect(all.length).toBeGreaterThanOrEqual(3)

  const cursor = all[1].id
  const afterSql = getTablesPaginatedSql({ schema: 'public', limit: 1000, afterOid: cursor })
  const after = await executeQuery<Row[]>(afterSql)

  expect(after.map((r) => r.id)).toEqual(all.slice(2).map((r) => r.id))
  // Strictly greater than the cursor — `c.oid > afterOid`, not `>=`.
  expect(after.every((r) => r.id > cursor)).toBe(true)
})

// Output shape parity with `pgMeta.tables.list()` — uses the same pgTableZod the
// non-paginated path validates against, so the two queries can't drift.
withTestDatabase('output parses as PGTable[] (with columns)', async ({ executeQuery }) => {
  const sql = getTablesPaginatedSql({
    schema: 'public',
    limit: 100,
    afterOid: 0,
    includeColumns: true,
  })
  const rows = await executeQuery(sql)
  const { zod } = pgMeta.tables.list({ includeColumns: true })

  const parsed = zod.parse(rows)
  expect(parsed.length).toBe(rows.length)
  expect(parsed.length).toBeGreaterThan(0)
})

withTestDatabase('output parses as PGTable[] (without columns)', async ({ executeQuery }) => {
  const sql = getTablesPaginatedSql({
    schema: 'public',
    limit: 100,
    afterOid: 0,
    includeColumns: false,
  })
  const rows = await executeQuery(sql)
  const { zod } = pgMeta.tables.list({ includeColumns: false })

  const parsed = zod.parse(rows)
  expect(parsed.length).toBe(rows.length)
  expect(parsed.length).toBeGreaterThan(0)
})

import { afterAll, expect, test } from 'vitest'

import { getTableRowsCountSql } from '../../../src'
import type { Filter } from '../../../src/query'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

type Db = Awaited<ReturnType<typeof createTestDatabase>>
type CountRow = { count: number; is_estimate: boolean }
type CountArgs = Parameters<typeof getTableRowsCountSql>[0]

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (name: string, fn: (db: Db) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

const tableOf = async (db: Db, qualified: string, name: string, schema: string) => {
  const [{ id }] = await db.executeQuery<{ id: number }[]>(
    `select '${qualified}'::regclass::oid::int8 as id;`
  )
  return { id: Number(id), name, schema }
}

const reltuplesOf = async (db: Db, qualified: string) => {
  const [{ reltuples }] = await db.executeQuery<{ reltuples: number }[]>(
    `select reltuples::int8 as reltuples from pg_class where oid = '${qualified}'::regclass;`
  )
  return Number(reltuples)
}

const runCount = async (db: Db, args: CountArgs) => {
  const [row] = await db.executeQuery<CountRow[]>(getTableRowsCountSql(args))
  return { count: Number(row.count), is_estimate: row.is_estimate }
}

// A never-analyzed table has pg_class.reltuples = -1 -- true for a brand-new
// EMPTY table, a small one, AND a freshly bulk-loaded huge one. autovacuum is
// disabled on every fixture so reltuples cannot flip mid-test.

withTestDatabase(
  'empty never-analyzed table -> exact count 0 (writable and read-only)',
  async (db) => {
    await db.executeQuery(
      `create table public.empty_t (id int primary key) with (autovacuum_enabled = false);`
    )
    expect(await reltuplesOf(db, 'public.empty_t')).toBe(-1)
    const table = await tableOf(db, 'public.empty_t', 'empty_t', 'public')

    // Postgres estimates a never-vacuumed heap at a ~10-page minimum, so a naive
    // reltuples=-1 -> estimate would report phantom rows here. The size gate
    // routes an empty (0-byte) heap to an exact count instead.
    expect(await runCount(db, { table })).toEqual({ count: 0, is_estimate: false })
    expect(await runCount(db, { table, isReadOnlyContext: true })).toEqual({
      count: 0,
      is_estimate: false,
    })
  }
)

withTestDatabase(
  'small never-analyzed table -> exact count (writable and read-only)',
  async (db) => {
    await db.executeQuery(`
      create table public.small_unanalyzed (id int primary key, val text)
        with (autovacuum_enabled = false);
      insert into public.small_unanalyzed select g, 'r' || g from generate_series(1, 1000) g;
    `)
    expect(await reltuplesOf(db, 'public.small_unanalyzed')).toBe(-1)
    const table = await tableOf(db, 'public.small_unanalyzed', 'small_unanalyzed', 'public')

    // Heap is a few tens of KB -- well under the byte gate -> exact count.
    expect(await runCount(db, { table })).toEqual({ count: 1000, is_estimate: false })
    expect(await runCount(db, { table, isReadOnlyContext: true })).toEqual({
      count: 1000,
      is_estimate: false,
    })
  }
)

withTestDatabase(
  'large never-analyzed table -> estimate',
  async (db) => {
    // Wide rows (~300-byte payload) so the heap clears the ~10MB byte gate with a
    // modest, fast-to-insert row count (~19MB at 60k rows) so reltuples=-1
    // would otherwise look "small" and exact-count.
    await db.executeQuery(`
      create table public.bulk_unanalyzed (id int primary key, val text)
        with (autovacuum_enabled = false);
      insert into public.bulk_unanalyzed
        select g, repeat('x', 300) from generate_series(1, 60000) g;
    `)
    expect(await reltuplesOf(db, 'public.bulk_unanalyzed')).toBe(-1)
    const [{ bytes }] = await db.executeQuery<{ bytes: number }[]>(
      `select pg_relation_size('public.bulk_unanalyzed'::regclass)::int8 as bytes;`
    )
    expect(Number(bytes)).toBeGreaterThan(10_000_000)
    const table = await tableOf(db, 'public.bulk_unanalyzed', 'bulk_unanalyzed', 'public')

    // Writable: EXPLAIN-based estimate (works without ANALYZE).
    const writable = await runCount(db, { table })
    expect(writable.is_estimate).toBe(true)
    expect(writable.count).toBeGreaterThan(1000)
    expect(writable.count).not.toBe(-1)

    // Read-only cannot create the estimate function -> reports -1 as an
    // estimate rather than a timing-out exact count.
    expect(await runCount(db, { table, isReadOnlyContext: true })).toEqual({
      count: -1,
      is_estimate: true,
    })
  }
)

withTestDatabase(
  'analyzed table below THRESHOLD_COUNT (default, filtered, enforceExactCount)',
  async (db) => {
    await db.executeQuery(`
      create table public.analyzed_small (id int primary key, status text);
      insert into public.analyzed_small
        select g, case when g % 2 = 0 then 'active' else 'inactive' end
        from generate_series(1, 10) g;
      analyze public.analyzed_small;
    `)
    const table = await tableOf(db, 'public.analyzed_small', 'analyzed_small', 'public')
    const activeFilter: Filter[] = [{ column: 'status', operator: '=', value: 'active' }]

    // Small analyzed table: exact count.
    expect(await runCount(db, { table })).toEqual({ count: 10, is_estimate: false })
    // Read-only default count agrees too.
    expect(await runCount(db, { table, isReadOnlyContext: true })).toEqual({
      count: 10,
      is_estimate: false,
    })
    // Filtered count agrees.
    expect(await runCount(db, { table, filters: activeFilter })).toEqual({
      count: 5,
      is_estimate: false,
    })
    // enforceExactCount always runs a real count, with or without filters.
    expect(await runCount(db, { table, enforceExactCount: true })).toEqual({
      count: 10,
      is_estimate: false,
    })
    expect(
      await runCount(db, {
        table,
        enforceExactCount: true,
        filters: activeFilter,
      })
    ).toEqual({ count: 5, is_estimate: false })
  }
)

withTestDatabase(
  'analyzed table over THRESHOLD_COUNT uses estimate',
  async (db) => {
    // reltuples > 50000 after analyze uses the estimate branch (raw reltuples
    // when unfiltered). The byte gate only affects reltuples = -1.
    await db.executeQuery(`
      create table public.big_analyzed (id int primary key)
        with (autovacuum_enabled = false);
      insert into public.big_analyzed select generate_series(1, 60000);
      analyze public.big_analyzed;
    `)
    expect(await reltuplesOf(db, 'public.big_analyzed')).toBeGreaterThan(50000)
    const table = await tableOf(db, 'public.big_analyzed', 'big_analyzed', 'public')

    // Non-readonly: both return the raw reltuples estimate.
    const estimated = await runCount(db, { table })
    expect(estimated.is_estimate).toBe(true)
    expect(estimated.count).toBeGreaterThan(1000)

    // Read-only: both report -1 as an estimate.
    expect(await runCount(db, { table, isReadOnlyContext: true })).toEqual({
      count: -1,
      is_estimate: true,
    })

    // enforceExactCount over the threshold still runs a real count.
    expect(await runCount(db, { table, enforceExactCount: true })).toEqual({
      count: 60000,
      is_estimate: false,
    })
  }
)

// A partitioned PARENT (relkind 'p') has no storage of its own, so
// pg_relation_size(parent) is 0. The size gate must use the whole partition tree
// or a large never-analyzed partitioned table would be misclassified as small
// and exact-counted across all partitions -- the exact timeout being fixed.
withTestDatabase(
  'large never-analyzed PARTITIONED table -> estimate (partition-tree size gate)',
  async (db) => {
    await db.executeQuery(`
      create table public.part_big (id int, region text, val text) partition by list (region);
      create table public.part_big_e partition of public.part_big for values in ('east')
        with (autovacuum_enabled = false);
      create table public.part_big_w partition of public.part_big for values in ('west')
        with (autovacuum_enabled = false);
      insert into public.part_big
        select g, case when g % 2 = 0 then 'east' else 'west' end, repeat('x', 300)
        from generate_series(1, 45000) g;
    `)
    // Parent is never-analyzed (reltuples = -1) and has zero own heap size...
    expect(await reltuplesOf(db, 'public.part_big')).toBe(-1)
    const [{ own, tree }] = await db.executeQuery<{ own: number; tree: number }[]>(`
      select
        pg_relation_size('public.part_big'::regclass)::int8 as own,
        (select coalesce(sum(pg_relation_size(relid)), 0)
         from pg_partition_tree('public.part_big'::regclass))::int8 as tree;
    `)
    expect(Number(own)).toBe(0) // ...so pg_relation_size alone would say "small"
    expect(Number(tree)).toBeGreaterThan(10_000_000) // the tree sum clears the gate
    const table = await tableOf(db, 'public.part_big', 'part_big', 'public')

    const estimated = await runCount(db, { table })
    expect(estimated.is_estimate).toBe(true)
    expect(estimated.count).toBeGreaterThan(1000)
    expect(estimated.count).not.toBe(-1)

    expect(await runCount(db, { table, isReadOnlyContext: true })).toEqual({
      count: -1,
      is_estimate: true,
    })
  }
)

withTestDatabase(
  'small never-analyzed PARTITIONED table -> exact count (writable and read-only)',
  async (db) => {
    await db.executeQuery(`
      create table public.part_small (id int, region text) partition by list (region);
      create table public.part_small_e partition of public.part_small for values in ('east')
        with (autovacuum_enabled = false);
      create table public.part_small_w partition of public.part_small for values in ('west')
        with (autovacuum_enabled = false);
      insert into public.part_small
        select g, case when g % 2 = 0 then 'east' else 'west' end from generate_series(1, 100) g;
    `)
    expect(await reltuplesOf(db, 'public.part_small')).toBe(-1)
    const table = await tableOf(db, 'public.part_small', 'part_small', 'public')

    expect(await runCount(db, { table })).toEqual({ count: 100, is_estimate: false })
    expect(await runCount(db, { table, isReadOnlyContext: true })).toEqual({
      count: 100,
      is_estimate: false,
    })
  }
)

withTestDatabase(
  'analyzed partitioned table below THRESHOLD_COUNT is exact',
  async (db) => {
    await db.executeQuery(`
      create table public.part_analyzed (id int, region text) partition by list (region);
      create table public.part_analyzed_e partition of public.part_analyzed for values in ('east');
      create table public.part_analyzed_w partition of public.part_analyzed for values in ('west');
      insert into public.part_analyzed
        select g, case when g % 2 = 0 then 'east' else 'west' end from generate_series(1, 100) g;
      analyze public.part_analyzed;
    `)
    const table = await tableOf(db, 'public.part_analyzed', 'part_analyzed', 'public')
    expect(await runCount(db, { table })).toEqual({
      count: 100,
      is_estimate: false,
    })
    expect(await runCount(db, { table, isReadOnlyContext: true })).toEqual({
      count: 100,
      is_estimate: false,
    })
  }
)

withTestDatabase(
  'view flowing through the row-count builder is exact',
  async (db) => {
    await db.executeQuery(`
    create table public.view_src (id int primary key);
    insert into public.view_src select generate_series(1, 7);
    create view public.v_rows as select * from public.view_src;
  `)
    const table = await tableOf(db, 'public.v_rows', 'v_rows', 'public')

    // A view has no heap (pg_relation_size 0, no partition tree) -> the gate keeps
    // an exact count.
    expect(await runCount(db, { table })).toEqual({ count: 7, is_estimate: false })
    expect(await runCount(db, { table, isReadOnlyContext: true })).toEqual({
      count: 7,
      is_estimate: false,
    })
  }
)

// ── Fix #1: the embedded estimate select is quoted with literal(), so backslash
// identifiers survive regardless of the session's standard_conforming_strings.
withTestDatabase(
  'estimate path quotes the embedded select safely (backslash names, scs on & off)',
  async (db) => {
    // Names contain a backslash; in the JS template `\\` is one literal backslash.
    await db.executeQuery(`
      create table public."wei\\rd" ("col\\umn" int) with (autovacuum_enabled = false);
      insert into public."wei\\rd" select g % 3 from generate_series(1, 60000) g;
      analyze public."wei\\rd";
    `)
    const [{ id }] = await db.executeQuery<{ id: number }[]>(
      `select 'public."wei\\rd"'::regclass::oid::int8 as id;`
    )
    // reltuples > THRESHOLD_COUNT + a filter -> the estimate (count_estimate)
    // branch runs, embedding the filtered select (with the backslash names) as a
    // literal inside the function call.
    const table = { id: Number(id), name: 'wei\\rd', schema: 'public' }
    const filters: Filter[] = [{ column: 'col\\umn', operator: '=', value: 1 }]

    const scsOn = await runCount(db, { table, filters })
    expect(scsOn.is_estimate).toBe(true)
    expect(Number.isFinite(scsOn.count)).toBe(true)

    // standard_conforming_strings = off in the SAME connection: the SET, the
    // CREATE FUNCTION, and the count must share one query (the test uses a pool).
    const withScsOff = (sql: string) => `set standard_conforming_strings = off;\n${sql}`
    const [scsOff] = await db.executeQuery<CountRow[]>(
      withScsOff(getTableRowsCountSql({ table, filters }))
    )
    // literal()/E'...' keeps the backslash identifiers intact under scs=off.
    expect(scsOff.is_estimate).toBe(true)
    expect(Number.isFinite(Number(scsOff.count))).toBe(true)
  }
)

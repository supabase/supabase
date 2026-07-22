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

// Execute BOTH the scoped and legacy renderings of the same args against the DB
// and assert identical results -- the equivalence contract for every case where
// the two paths must agree (the ONLY intentional divergence is a never-analyzed
// table whose heap exceeds the byte gate; that asymmetry is the fix and is
// asserted separately below).
const assertScopedEqualsLegacy = async (db: Db, base: Omit<CountArgs, 'scoped'>) => {
  const legacy = await runCount(db, { ...base, scoped: false })
  const scoped = await runCount(db, { ...base, scoped: true })
  expect(scoped, 'scoped must equal legacy for this case').toEqual(legacy)
  return scoped
}

// A never-analyzed table has pg_class.reltuples = -1 -- true for a brand-new
// EMPTY table, a small one, AND a freshly bulk-loaded huge one. autovacuum is
// disabled on every fixture so reltuples cannot flip mid-test.

withTestDatabase(
  'scoped: empty never-analyzed table -> exact count 0, is_estimate=false (both modes)',
  async (db) => {
    await db.executeQuery(
      `create table public.empty_t (id int primary key) with (autovacuum_enabled = false);`
    )
    expect(await reltuplesOf(db, 'public.empty_t')).toBe(-1)
    const table = await tableOf(db, 'public.empty_t', 'empty_t', 'public')

    // Postgres estimates a never-vacuumed heap at a ~10-page minimum, so a naive
    // reltuples=-1 -> estimate would report phantom rows here. The size gate
    // routes an empty (0-byte) heap to an exact count instead.
    expect(await runCount(db, { table, scoped: true })).toEqual({ count: 0, is_estimate: false })
    expect(await runCount(db, { table, scoped: true, isReadOnlyContext: true })).toEqual({
      count: 0,
      is_estimate: false,
    })
  }
)

withTestDatabase(
  'scoped: small never-analyzed table -> exact count, is_estimate=false (both modes)',
  async (db) => {
    await db.executeQuery(`
      create table public.small_unanalyzed (id int primary key, val text)
        with (autovacuum_enabled = false);
      insert into public.small_unanalyzed select g, 'r' || g from generate_series(1, 1000) g;
    `)
    expect(await reltuplesOf(db, 'public.small_unanalyzed')).toBe(-1)
    const table = await tableOf(db, 'public.small_unanalyzed', 'small_unanalyzed', 'public')

    // Heap is a few tens of KB -- well under the byte gate -> exact count.
    expect(await runCount(db, { table, scoped: true })).toEqual({ count: 1000, is_estimate: false })
    expect(await runCount(db, { table, scoped: true, isReadOnlyContext: true })).toEqual({
      count: 1000,
      is_estimate: false,
    })
  }
)

withTestDatabase(
  'scoped INTENTIONALLY diverges from legacy: large never-analyzed table -> estimate',
  async (db) => {
    // Wide rows (~300-byte payload) so the heap clears the ~10MB byte gate with a
    // modest, fast-to-insert row count (~19MB at 60k rows) -- the case the legacy
    // path mishandles (treats reltuples=-1 as small, runs a timing-out count).
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

    // Non-readonly scoped: EXPLAIN-based estimate (works without ANALYZE).
    const scoped = await runCount(db, { table, scoped: true })
    expect(scoped.is_estimate).toBe(true)
    expect(scoped.count).toBeGreaterThan(1000)
    expect(scoped.count).not.toBe(-1)

    // Readonly scoped: cannot create the estimate function -> reports -1 as an
    // estimate rather than a timing-out exact count.
    expect(await runCount(db, { table, scoped: true, isReadOnlyContext: true })).toEqual({
      count: -1,
      is_estimate: true,
    })

    // The intentional divergence: legacy (scoped:false) still runs an exact count
    // on the -1 table (the pre-fix behavior the scoped path corrects).
    const legacy = await runCount(db, { table })
    expect(legacy).toEqual({ count: 60000, is_estimate: false })
    expect(legacy.is_estimate).not.toBe(scoped.is_estimate)
  }
)

withTestDatabase(
  'scoped == legacy for an analyzed table below THRESHOLD_COUNT (default, filtered, enforceExactCount)',
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

    // Default count: both paths exact-count a small analyzed table.
    expect(await assertScopedEqualsLegacy(db, { table })).toEqual({ count: 10, is_estimate: false })
    // Read-only default count agrees too.
    expect(await assertScopedEqualsLegacy(db, { table, isReadOnlyContext: true })).toEqual({
      count: 10,
      is_estimate: false,
    })
    // Filtered count agrees.
    expect(await assertScopedEqualsLegacy(db, { table, filters: activeFilter })).toEqual({
      count: 5,
      is_estimate: false,
    })
    // enforceExactCount ignores scoped entirely and agrees, with/without filters.
    expect(await assertScopedEqualsLegacy(db, { table, enforceExactCount: true })).toEqual({
      count: 10,
      is_estimate: false,
    })
    expect(
      await assertScopedEqualsLegacy(db, {
        table,
        enforceExactCount: true,
        filters: activeFilter,
      })
    ).toEqual({ count: 5, is_estimate: false })
  }
)

withTestDatabase(
  'scoped == legacy for an analyzed table over THRESHOLD_COUNT (estimate path unchanged)',
  async (db) => {
    // reltuples > 50000 after analyze routes BOTH paths to the estimate branch
    // (raw reltuples when unfiltered) -- identical output; the byte gate only
    // affects the reltuples = -1 case, not this one.
    await db.executeQuery(`
      create table public.big_analyzed (id int primary key)
        with (autovacuum_enabled = false);
      insert into public.big_analyzed select generate_series(1, 60000);
      analyze public.big_analyzed;
    `)
    expect(await reltuplesOf(db, 'public.big_analyzed')).toBeGreaterThan(50000)
    const table = await tableOf(db, 'public.big_analyzed', 'big_analyzed', 'public')

    // Non-readonly: both return the raw reltuples estimate.
    const scoped = await assertScopedEqualsLegacy(db, { table })
    expect(scoped.is_estimate).toBe(true)
    expect(scoped.count).toBeGreaterThan(1000)

    // Read-only: both report -1 as an estimate.
    expect(await assertScopedEqualsLegacy(db, { table, isReadOnlyContext: true })).toEqual({
      count: -1,
      is_estimate: true,
    })

    // enforceExactCount over the threshold still runs a real count in both paths.
    expect(await assertScopedEqualsLegacy(db, { table, enforceExactCount: true })).toEqual({
      count: 60000,
      is_estimate: false,
    })
  }
)

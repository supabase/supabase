import { afterAll, beforeAll, expect, test } from 'vitest'

import { getTableEditorSql } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

/**
 * Stress / non-regression test for the Table Editor introspection query
 * (`getTableEditorSql`, packages/pg-meta/src/sql/studio/table-editor/table.ts).
 *
 * Context: a real production catalog had ~267K pg_class rows. Before
 * https://github.com/supabase/supabase/pull/47894, five catalog scans in
 * that query were unscoped, causing full seq scans over pg_index/pg_constraint
 * on every Table Editor open -- O(catalog) work regardless of which table was
 * opened. This test builds a large synthetic catalog and asserts the query's
 * EXPLAIN plan stays index-only (aside from one documented, unavoidable seq
 * scan on pg_constraint -- there is no index on pg_constraint.confrelid) and
 * completes within a loose time bound, so a future edit that reintroduces an
 * unscoped catalog scan fails CI.
 *
 * `TABLE_COUNT` defaults to 2000 to keep CI fast. Crank `PG_META_STRESS_TABLES`
 * up (e.g. 12000+) for local investigation closer to real incident scale.
 */
const TABLE_COUNT = Number(process.env.PG_META_STRESS_TABLES ?? 2000)

let db: Awaited<ReturnType<typeof createTestDatabase>>
let midChainTableId: number
let hubTableId: number

beforeAll(async () => {
  db = await createTestDatabase()

  // Build the synthetic catalog via a server-side procedure with batched
  // commits every 100 tables -- a single transaction creating thousands of
  // tables/indexes/constraints would exhaust the lock table.
  //
  // Per table: a PK index, a unique constraint+index, a check constraint, and
  // an FK to the previous table. Every 10th table also FKs to t_0, making
  // t_0 a hub with many incoming FKs (the unavoidable pg_constraint seq scan).
  await db.executeQuery(`
    create schema stress;

    create procedure stress.build(n int) language plpgsql as $$
    begin
      for i in 0..n-1 loop
        execute format(
          'create table stress.t_%s (id int primary key, u int unique, c int check (c > 0)%s%s)',
          i,
          case when i > 0 then format(', fk int references stress.t_%s(id)', i - 1) else '' end,
          case when i > 0 and i % 10 = 0 then ', hub int references stress.t_0(id)' else '' end
        );
        if i % 100 = 99 then commit; end if;
      end loop;
    end $$;
  `)

  // `call` performs commits internally, so it must run as its own statement:
  // a pg client query is autocommit by default, but bundling it with other
  // statements in one multi-statement message implicitly wraps the whole
  // message in one transaction, which conflicts with the commits inside the
  // procedure's loop.
  await db.executeQuery(`call stress.build(${TABLE_COUNT});`)
  await db.executeQuery(`analyze;`)

  const [{ id: midChainId }] = await db.executeQuery<{ id: number }[]>(
    `select 'stress.t_1000'::regclass::oid::int8 as id;`
  )
  const [{ id: hubId }] = await db.executeQuery<{ id: number }[]>(
    `select 'stress.t_0'::regclass::oid::int8 as id;`
  )
  midChainTableId = midChainId
  hubTableId = hubId
}, 120_000)

afterAll(async () => {
  await db.cleanup()
  await cleanupRoot()
})

// Tiny, fixed-size system catalogs (a handful of schemas/FDWs/enums/procs)
// that PostgreSQL's planner will always choose to seq scan regardless of
// query scoping, because a full scan of a handful of rows is cheaper than an
// index scan. These don't grow with TABLE_COUNT and are unrelated to the
// O(catalog) regression this test guards against, which is specifically
// about catalogs that scale with the number of tables/columns/indexes/
// constraints (pg_class, pg_attribute, pg_index, pg_constraint).
const BENIGN_TINY_CATALOG_RELATIONS = new Set([
  'pg_namespace',
  'pg_foreign_table',
  'pg_foreign_server',
  'pg_foreign_data_wrapper',
  'pg_enum',
  'pg_proc',
])

// The only scaling-catalog seq scan that's structurally unavoidable: there is
// no index on pg_constraint.confrelid, so the incoming-FK half of the
// `relationships` CTE always does one filtered seq scan of pg_constraint.
const DOCUMENTED_SCALING_SEQ_SCAN_RELATION = 'pg_constraint'
const MAX_DOCUMENTED_SEQ_SCANS = 2

function collectSeqScans(
  node: unknown,
  out: Array<string | undefined> = []
): Array<string | undefined> {
  if (Array.isArray(node)) {
    for (const item of node) collectSeqScans(item, out)
  } else if (node !== null && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (obj['Node Type'] === 'Seq Scan') {
      out.push(obj['Relation Name'] as string | undefined)
    }
    for (const key of Object.keys(obj)) {
      collectSeqScans(obj[key], out)
    }
  }
  return out
}

async function explainTableEditorQuery(id: number) {
  const sql = getTableEditorSql({ id })
  const [row] = await db.executeQuery<Array<Record<string, any>>>(
    `explain (analyze, format json) ${sql}`
  )
  const [plan] = row['QUERY PLAN'] as Array<{ Plan: unknown; 'Execution Time': number }>
  return plan
}

function assertPlanStaysScoped(plan: { Plan: unknown; 'Execution Time': number }) {
  const seqScans = collectSeqScans(plan.Plan)
  const documentedScans = seqScans.filter(
    (relation) => relation === DOCUMENTED_SCALING_SEQ_SCAN_RELATION
  )
  const offending = seqScans.filter(
    (relation) =>
      relation !== DOCUMENTED_SCALING_SEQ_SCAN_RELATION &&
      !(relation && BENIGN_TINY_CATALOG_RELATIONS.has(relation))
  )

  expect(
    offending,
    `Unexpected seq scan(s) on: ${offending.join(', ') || '(unknown relation)'}. Only ` +
      `pg_constraint may be seq scanned at scale (no index exists on confrelid); tiny, ` +
      `non-scaling catalogs (${[...BENIGN_TINY_CATALOG_RELATIONS].join(', ')}) are also tolerated. ` +
      `All seq scans found: ${JSON.stringify(seqScans)}`
  ).toEqual([])

  expect(
    documentedScans.length,
    `Expected at most ${MAX_DOCUMENTED_SEQ_SCANS} pg_constraint seq scan node(s) (the documented ` +
      `confrelid lookup), found ${documentedScans.length}: ${JSON.stringify(seqScans)}`
  ).toBeLessThanOrEqual(MAX_DOCUMENTED_SEQ_SCANS)

  // Deliberately loose: measured ~10-40ms at this scale post-fix, but the old
  // O(catalog) query took >1s even at 12K tables. This still catches a
  // reintroduced unscoped scan without flaking on a slow CI box.
  expect(plan['Execution Time']).toBeLessThan(1000)
}

test('plan stays index-only for a mid-chain table (stress.t_1000)', async () => {
  const plan = await explainTableEditorQuery(midChainTableId)
  assertPlanStaysScoped(plan)
}, 60_000)

test('plan stays index-only for the hub table with many incoming FKs (stress.t_0)', async () => {
  const plan = await explainTableEditorQuery(hubTableId)
  assertPlanStaysScoped(plan)
}, 60_000)

test('sanity: the real (non-EXPLAIN) query returns a well-formed, non-vacuous entity for t_1000', async () => {
  const sql = getTableEditorSql({ id: midChainTableId })
  const [{ entity }] = await db.executeQuery<Array<{ entity: any }>>(sql)

  expect(entity.schema).toBe('stress')
  expect(entity.name).toBe('t_1000')
  expect(entity.primary_keys.length).toBeGreaterThan(0)
  expect(entity.relationships.length).toBeGreaterThan(0)
  expect(
    entity.relationships.some(
      (r: any) => r.source_table_name === 't_1000' && r.target_table_name === 't_999'
    )
  ).toBe(true)
  expect(
    entity.relationships.some(
      (r: any) => r.source_table_name === 't_1001' && r.target_table_name === 't_1000'
    )
  ).toBe(true)
}, 60_000)

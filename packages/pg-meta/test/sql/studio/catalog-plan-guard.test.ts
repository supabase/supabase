import { afterAll, beforeAll, expect, test } from 'vitest'

import {
  createPgGetTabledefSql,
  getEntityDefinitionsSql,
  getEntityTypesSQL,
  getForeignKeyConstraintsSql,
  getIndexesSQL,
  getTableColumnsSql,
  getTableConstraintsSql,
  getTableDefinitionSql,
  getTableEditorSql,
  getTablesPaginatedSql,
  getViewDefinitionSql,
} from '../../../src'
import { assertPlanWithinBudget, explainAnalyze } from '../../db/plan-guard'
import { buildStressCatalog, STRESS_TABLE_COUNT } from '../../db/stress-catalog'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

/**
 * Catalog query plan guard for hot-path Studio introspection queries.
 *
 * Builds a large synthetic catalog ONCE (see test/db/stress-catalog.ts) and, for
 * each covered query, asserts via EXPLAIN (ANALYZE, FORMAT JSON) that the plan
 * stays scoped: no seq scans over catalogs that scale with schema size, aside
 * from tiny non-scaling catalogs (always tolerated) and structurally
 * unavoidable scans carrying a written justification (see test/db/plan-guard.ts
 * for THE RULE).
 *
 * Context: a real production catalog had ~267K pg_class rows. Before
 * https://github.com/supabase/supabase/pull/47894, unscoped CTEs in the Table
 * Editor query full-scanned pg_index/pg_constraint on every open -- O(catalog)
 * work regardless of which table was opened, taking 30-58s at incident scale.
 *
 * NOTE: the scoped introspection behavior from PR #47894 defaults to OFF and is
 * gated behind a `scoped` flag so Studio can enable it progressively via a
 * feature flag. The legacy (scoped:false) path is intentionally NOT exercised
 * here -- this guard tests the SCOPED path, so every builder below is called
 * with `scoped: true`. Once the rollout completes, drop the legacy path and the
 * flag, and this guard becomes the only shape.
 */

let db: Awaited<ReturnType<typeof createTestDatabase>>
let midChainTableId: number
let hubTableId: number
let viewId: number

beforeAll(async () => {
  db = await createTestDatabase()
  await buildStressCatalog(db, STRESS_TABLE_COUNT)

  const [{ id: midChainId }] = await db.executeQuery<{ id: number }[]>(
    `select 'stress.t_1000'::regclass::oid::int8 as id;`
  )
  const [{ id: hubId }] = await db.executeQuery<{ id: number }[]>(
    `select 'stress.t_0'::regclass::oid::int8 as id;`
  )
  const [{ id: vId }] = await db.executeQuery<{ id: number }[]>(
    `select 'stress.v_hub'::regclass::oid::int8 as id;`
  )
  midChainTableId = midChainId
  hubTableId = hubId
  viewId = vId
}, 120_000)

afterAll(async () => {
  await db.cleanup()
  await cleanupRoot()
})

// ── getTableEditorSql (table-editor/table.ts) — per-table ────────────────────
// The only scaling-catalog seq scan that's structurally unavoidable: there is
// no index on pg_constraint.confrelid, so the incoming-FK half of the
// `relationships` CTE always does one filtered seq scan of pg_constraint.
const TABLE_EDITOR_BUDGET = {
  allowedSeqScans: {
    pg_constraint: {
      max: 2,
      reason: 'no index on pg_constraint.confrelid -- incoming-FK half of relationships CTE',
    },
  },
}

test('getTableEditorSql: plan stays scoped for a mid-chain table (stress.t_1000)', async () => {
  const result = await explainAnalyze(db, getTableEditorSql({ id: midChainTableId, scoped: true }))
  assertPlanWithinBudget(result, TABLE_EDITOR_BUDGET)
}, 60_000)

test('getTableEditorSql: plan stays scoped for the hub table with many incoming FKs (stress.t_0)', async () => {
  const result = await explainAnalyze(db, getTableEditorSql({ id: hubTableId, scoped: true }))
  assertPlanWithinBudget(result, TABLE_EDITOR_BUDGET)
}, 60_000)

test('getTableEditorSql: real (non-EXPLAIN) query returns a well-formed entity for t_1000', async () => {
  const [{ entity }] = await db.executeQuery<Array<{ entity: any }>>(
    getTableEditorSql({ id: midChainTableId, scoped: true })
  )

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

// ── getTableConstraintsSql (table-editor/constraints.ts) — per-table ─────────
test('getTableConstraintsSql: plan stays scoped for a single table', async () => {
  const result = await explainAnalyze(db, getTableConstraintsSql({ id: midChainTableId }))
  assertPlanWithinBudget(result, {})
}, 60_000)

// ── getForeignKeyConstraintsSql (table-editor/foreign-keys.ts) — per-schema ──
// A schema-wide FK listing must scan every FK constraint (no index on
// pg_constraint.contype) and join pg_class (no index on relnamespace alone).
test('getForeignKeyConstraintsSql: plan stays scoped for a schema', async () => {
  const result = await explainAnalyze(db, getForeignKeyConstraintsSql({ schema: 'stress' }))
  assertPlanWithinBudget(result, {
    allowedSeqScans: {
      pg_constraint: {
        max: 1,
        reason: "per-schema FK listing filters pg_constraint.contype='f'; no index on contype",
      },
      pg_class: {
        max: 1,
        reason:
          'per-schema listing; no index on pg_class.relnamespace alone, so the schema filter cannot prune the scan',
      },
    },
  })
}, 60_000)

// ── getEntityTypesSQL (table-editor/entities.ts) — per-schema list ───────────
test('getEntityTypesSQL: plan stays scoped for a schema listing', async () => {
  const result = await explainAnalyze(
    db,
    getEntityTypesSQL({
      schemas: ['stress'],
      sort: 'alphabetical',
      filterTypes: ['r', 'v', 'm', 'f', 'p'],
      limit: 100,
      page: 0,
    })
  )
  assertPlanWithinBudget(result, {})
}, 60_000)

// ── getTablesPaginatedSql (database/tables-paginated.ts) — per-schema page ───
// The query IS scoped: the `page` CTE picks <=limit OIDs via pg_class_oid_index,
// and every enrichment CTE constrains to `in (select oid from page)`. The
// planner still full-scans the small enrichment catalogs once and hash-joins
// them against the page set (cheaper than N index probes for a batch of OIDs).
// These are structural for a list-with-enrichment query, not the unscoped
// O(catalog) pattern (which had no page constraint at all).
test('getTablesPaginatedSql: plan stays scoped for a schema page', async () => {
  const result = await explainAnalyze(
    db,
    getTablesPaginatedSql({ schema: 'stress', limit: 100, afterOid: 0, includeColumns: true })
  )
  assertPlanWithinBudget(result, {
    allowedSeqScans: {
      pg_class: {
        max: 1,
        reason:
          'page CTE + columns enrichment; no index on pg_class.relnamespace, and the planner batches the page-OID lookup as one scan',
      },
      pg_index: {
        max: 1,
        reason:
          'primary-key CTE filters pg_index.indisprimary (unindexed), joined against the page set',
      },
      pg_constraint: {
        max: 4,
        reason:
          'relationships CTE (two UNION arms), incl. confrelid which has no index; scanned once per arm and hash-joined against the page set',
      },
      pg_attribute: {
        max: 3,
        reason:
          'primary-key/relationships/columns enrichment; scanned once and hash-joined against the page set rather than probed per OID',
      },
      pg_attrdef: {
        max: 1,
        reason: 'columns enrichment resolves defaults; scanned once against the page set',
      },
      pg_type: {
        max: 1,
        reason: 'columns enrichment resolves column types; scanned once against the page set',
      },
    },
    // EXPLAIN ANALYZE inflates timing with per-node instrumentation on this
    // multi-CTE query (~2.9s measured at 2000 tables vs a far lower real
    // execution time). The seq-scan budget above is the primary guard here;
    // the time bound is loosened to catch only gross regressions.
    maxExecutionTimeMs: 6000,
  })
}, 60_000)

// ── getTableColumnsSql (database/columns.ts) — per-table ─────────────────────
test('getTableColumnsSql: plan stays scoped for a single table', async () => {
  const result = await explainAnalyze(db, getTableColumnsSql({ table: 't_1000', schema: 'stress' }))
  assertPlanWithinBudget(result, {})
}, 60_000)

// ── getIndexesSQL (database/indexes.ts) — per-schema list ────────────────────
// A schema-wide index listing starts from pg_index (no index on the
// schema-side columns), joins pg_class twice (table + index relations) and
// pg_attribute for column names -- all scanned once and filtered by namespace.
test('getIndexesSQL: plan stays scoped for a schema', async () => {
  const result = await explainAnalyze(db, getIndexesSQL({ schema: 'stress' }))
  assertPlanWithinBudget(result, {
    allowedSeqScans: {
      pg_index: {
        max: 1,
        reason:
          'per-schema index listing enumerates all indexes; namespace filter is on the joined pg_class',
      },
      pg_class: {
        max: 2,
        reason:
          'joins the table and index relations; no index on pg_class.relnamespace to prune by schema',
      },
      pg_attribute: {
        max: 1,
        reason: 'resolves index column names; scanned once and hash-joined',
      },
    },
  })
}, 60_000)

// The two *DefinitionSql builders prepend a CREATE (pg_temp) function block
// (CREATE_PG_GET_TABLEDEF_SQL) that cannot be wrapped in EXPLAIN. Run that
// setup on the (single, pooled) connection first, then EXPLAIN only the tail
// SELECT -- which is the part whose plan we actually care about.
async function explainDefinitionQuery(fullSql: string) {
  const setup = createPgGetTabledefSql({ scoped: true }) as unknown as string
  const tail = fullSql.slice(fullSql.indexOf(setup) + setup.length)
  await db.executeQuery(setup)
  return explainAnalyze(db, tail)
}

// ── getTableDefinitionSql (database/table-definition.ts) — per-table ─────────
// Only the outer table_info lookup is planned (pg_get_tabledef is an opaque
// plpgsql function); it resolves the table by oid, so no scaling seq scans.
test('getTableDefinitionSql: plan stays scoped for a single table', async () => {
  const result = await explainDefinitionQuery(
    getTableDefinitionSql({ id: midChainTableId, scoped: true })
  )
  assertPlanWithinBudget(result, {})
}, 60_000)

// ── getEntityDefinitionsSql (database/table-definition.ts) — per-schema list ─
// The SQL-level plan is clean (only pg_namespace); the real cost is the opaque
// pg_temp.pg_get_tabledef plpgsql function, which reconstructs full DDL per
// entity via its own catalog introspection that the plan guard cannot see
// inside. That function used to scan all of information_schema.columns once
// PER COLUMN (and information_schema.tables once per call) just to decide
// whether a name needs double-quoting — ~5.6s for a 25-entity page at 2000
// tables, growing superlinearly with catalog size (~3.7s for a SINGLE entity
// at 12K tables). Those scans were replaced with direct string tests, so the
// whole page now runs in well under a second; the time bound below is the
// guard against that per-entity cost regressing, since seq-scan detection is
// blind inside the function. The production default limit is 100; 100 entities
// on a 12K-table catalog measured ~0.9s post-fix.
test('getEntityDefinitionsSql: plan stays scoped for a schema', async () => {
  const result = await explainDefinitionQuery(
    getEntityDefinitionsSql({ schemas: ['stress'], limit: 100, scoped: true })
  )
  assertPlanWithinBudget(result, {
    // ~0.3s measured at 2000 tables post-fix for a 100-entity page; loose
    // enough for slow CI, tight enough to catch reintroduced O(catalog)
    // work inside pg_get_tabledef (which measured 5.6s for just 25 entities).
    maxExecutionTimeMs: 3_000,
  })
}, 60_000)

// ── getViewDefinitionSql (database/views.ts) — per-view ──────────────────────
test('getViewDefinitionSql: plan stays scoped for a single view', async () => {
  const result = await explainAnalyze(db, getViewDefinitionSql({ id: viewId }))
  assertPlanWithinBudget(result, {})
}, 60_000)

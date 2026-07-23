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
import tablePrivileges from '../../../src/pg-meta-table-privileges'
import * as tables from '../../../src/pg-meta-tables'
import * as types from '../../../src/pg-meta-types'
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
  assertPlanWithinBudget(result, {
    allowedSeqScans: {
      pg_class: {
        max: 1,
        reason:
          'per-schema entity listing must read every relation in the schema; no index leads on pg_class.relnamespace, so the filter cannot prune it. The planner choice between a seq scan and a full-index bitmap scan is marginal and version/stats dependent (observed flipping on PG17) -- one filtered pass of pg_class either way',
      },
    },
  })
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

// ── types.list (sql/types.ts) — per-schema user-defined types listing ────────
// The scoped rewrite filters pg_type by schema FIRST and then computes enums /
// composite attributes per surviving row via correlated subqueries (index scans
// on pg_enum's (enumtypid) and pg_attribute's (attrelid, attnum)), instead of
// the legacy catalog-wide GROUP BY aggregates. The one structurally unavoidable
// pass is over pg_type itself: a per-schema type listing must read every type in
// the schema, and pg_type has no index leading on typnamespace (only
// pg_type_typname_nsp_index on (typname, typnamespace)), so the schema filter
// cannot prune the scan -- one filtered pass of pg_type either way. Same class
// as the pg_constraint.confrelid / pg_class.relnamespace justifications.
const TYPES_LIST_BUDGET = {
  allowedSeqScans: {
    pg_type: {
      max: 1,
      reason:
        'per-schema type listing must read every type in the schema; no index leads on pg_type.typnamespace (only (typname, typnamespace)), so the filter cannot prune it. The planner picks a seq scan (PG17) or a full-index bitmap scan (PG14/15) depending on version/stats -- one filtered pass of pg_type either way',
    },
  },
}
test('types.list: scoped plan stays scoped for a schema', async () => {
  const result = await explainAnalyze(
    db,
    types.list({ includedSchemas: ['stress'], scoped: true }).sql
  )
  assertPlanWithinBudget(result, TYPES_LIST_BUDGET)
}, 60_000)

test('types.list: scoped real query returns the schema’s enums and composites', async () => {
  const { sql, zod } = types.list({ includedSchemas: ['stress'], scoped: true })
  const rows = zod.parse(await db.executeQuery(sql))
  // stress has enums (mood/priority/e_*) and composites (addr/pair/ct_*).
  const mood = rows.find((t) => t.name === 'mood')
  expect(mood?.enums).toEqual(['ecstatic', 'sad', 'happy', 'ok'])
  // `pair` dropped its middle attribute; the scoped path must skip it.
  expect(rows.find((t) => t.name === 'pair')?.attributes.map((a) => a.name)).toEqual(['a', 'b'])
  expect(rows.length).toBeGreaterThan(400)
}, 60_000)

// The grantee/grantor resolution joins pg_roles (a view over pg_authid) TWICE —
// once for the grantor, once for the grantee UNION that appends PUBLIC — so the
// plan seq-scans pg_authid twice. pg_authid holds a fixed handful of roles and
// does NOT scale with schema size (tables/columns/constraints), so this is
// structural and unrelated to the O(catalog) regression this harness guards.
const TABLE_PRIVILEGES_BUDGET = {
  allowedSeqScans: {
    pg_authid: {
      max: 2,
      reason:
        'grantee/grantor resolution joins pg_roles (view over pg_authid) twice (grantor + grantee-with-PUBLIC union); pg_authid scales with role count, not schema size',
    },
  },
}

// ── tablePrivileges.list (sql/table-privileges.ts) — per-schema listing ──────
// Scoped pushes the schema filter into the base WHERE (before the aclexplode
// lateral / GROUP BY) so pg_class is pruned before privileges are exploded.
test('tablePrivileges.list: scoped plan stays scoped for a schema', async () => {
  const result = await explainAnalyze(
    db,
    tablePrivileges.list({ includedSchemas: ['stress'], scoped: true }).sql
  )
  assertPlanWithinBudget(result, TABLE_PRIVILEGES_BUDGET)
}, 60_000)

// ── tablePrivileges.retrieve (sql/table-privileges.ts) — per-relation ────────
// Scoped pushes the schema+name (or oid) predicate into the base WHERE so the
// relation is resolved via pg_class's (relname, relnamespace) index.
test('tablePrivileges.retrieve: scoped plan stays scoped for a single relation', async () => {
  const result = await explainAnalyze(
    db,
    tablePrivileges.retrieve({ name: 't_1000', schema: 'stress', scoped: true }).sql
  )
  assertPlanWithinBudget(result, TABLE_PRIVILEGES_BUDGET)
}, 60_000)

// ── tables.retrieve (pg-meta-tables.ts / sql/tables.ts) — single table ───────
// Scoped pushes the target OID (a literal, or an initplan scalar subquery
// resolved via pg_class's (relname, relnamespace) index) into the base scan and
// every enrichment subquery, so pg_class/pg_attribute/pg_type/pg_index are all
// index-driven. Two scaling-catalog seq scans remain and are structural:
//   - pg_constraint: the relationships subquery keeps BOTH FK directions and
//     pg_constraint.confrelid has no index, so the incoming-FK half is a seq
//     scan (identical to getTableEditorSql's relationships CTE);
//   - pg_attrdef: the columns enrichment resolves column defaults; pg_attrdef is
//     scanned once and hash-joined against the target's (few) attributes.
const TABLES_RETRIEVE_BUDGET = {
  allowedSeqScans: {
    pg_constraint: {
      max: 2,
      reason:
        'relationships subquery keeps both FK directions; no index on pg_constraint.confrelid, so the incoming-FK half is a seq scan (same as getTableEditorSql)',
    },
    pg_attrdef: {
      max: 1,
      reason: 'columns enrichment resolves defaults; pg_attrdef scanned once and hash-joined',
    },
  },
}

test('tables.retrieve: scoped plan stays scoped for a single table by id', async () => {
  const result = await explainAnalyze(
    db,
    tables.retrieve({ id: midChainTableId, scoped: true }).sql
  )
  assertPlanWithinBudget(result, TABLES_RETRIEVE_BUDGET)
}, 60_000)

test('tables.retrieve: scoped plan stays scoped for a single table by name+schema', async () => {
  const result = await explainAnalyze(
    db,
    tables.retrieve({ name: 't_1000', schema: 'stress', scoped: true }).sql
  )
  assertPlanWithinBudget(result, TABLES_RETRIEVE_BUDGET)
}, 60_000)

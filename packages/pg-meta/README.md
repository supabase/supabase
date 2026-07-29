# @supabase/pg-meta

SQL builders for Postgres catalog introspection, shared by Supabase Studio and
[`postgres-meta`](https://github.com/supabase/postgres-meta). Each builder in
`src/sql/` returns a safe, parameterized SQL fragment (`SafeSqlFragment`) that a
caller executes against a user's live database to read schema metadata — tables,
columns, constraints, indexes, relationships, entity definitions, and so on.

The `studio/` subtree holds the queries the Studio dashboard runs on every page
open (Table Editor, Database pages, entity lists, definitions).

## Catalog query plan guard

### Why this exists

These queries run against **the user's live catalog**, whose size we don't
control. A real production catalog had ~267K `pg_class` rows. Before
[#47894](https://github.com/supabase/supabase/pull/47894), several CTEs in the
Table Editor query were **unscoped**: they scanned `pg_index`/`pg_constraint`
across the whole catalog regardless of which table was being opened. That turned
a single Table Editor open into `O(catalog)` sequential scans — 30–58s of work,
tripping statement timeouts, on large catalogs.

The fix scoped those CTEs to the requested table OID. To keep that class of
regression out for good, the package has a **plan guard**: a test suite that
builds a large synthetic catalog and asserts, via `EXPLAIN (ANALYZE, FORMAT
JSON)`, that each hot-path query's plan stays scoped.

- `test/db/stress-catalog.ts` — builds a synthetic `stress` schema (default 2000
  tables, plus a view, a materialized view, and a partitioned table).
- `test/db/plan-guard.ts` — `explainAnalyze()` + `assertPlanWithinBudget()` and
  the tolerated tiny-catalog set.
- `test/sql/studio/catalog-plan-guard.test.ts` — one budget per covered query.

### THE RULE for new queries

> Every new introspection query added under `src/sql/` that runs on a user's
> live catalog **must** get a budget entry in
> `test/sql/studio/catalog-plan-guard.test.ts`.

Sequential scans over catalogs that **scale with schema size** — `pg_class`,
`pg_attribute`, `pg_index`, `pg_constraint`, `pg_attrdef`, `pg_description`,
`pg_depend`, `pg_policy`, `pg_trigger`, `pg_rewrite`, … — are only acceptable
with a **written structural justification**. An unscoped scan with no such
justification is a bug: scope the query to the requested OID/schema so it uses
an index instead.

### How to add a budget entry

Run the query through the harness against the stress catalog and set a budget:

```ts
test('getMyNewSql: plan stays scoped', async () => {
  const result = await explainAnalyze(db, getMyNewSql({ id: someTableId }))
  assertPlanWithinBudget(result, {
    // Omit allowedSeqScans entirely for a per-object query that must be fully
    // index-scoped. Add an entry only for a structurally unavoidable scan:
    allowedSeqScans: {
      pg_constraint: {
        max: 2,
        reason: 'no index on pg_constraint.confrelid — incoming-FK lookup',
      },
    },
    maxExecutionTimeMs: 1000, // default; loosen only with a comment
  })
})
```

### What's tolerated

- **Tiny, fixed-size catalogs** (`pg_namespace`, `pg_foreign_table`,
  `pg_foreign_server`, `pg_foreign_data_wrapper`, `pg_enum`, `pg_proc`) are
  always tolerated. The planner full-scans them because they hold a handful of
  rows and don't grow with table count. See `TINY_NON_SCALING_CATALOGS`.
- **Justified structural scans** on scaling catalogs — e.g. there is no index on
  `pg_constraint.confrelid`, so the incoming-FK half of a relationships lookup
  must seq scan; a per-schema listing can't prune `pg_class` because there is no
  index on `relnamespace` alone. Each such scan carries a `reason` string and a
  `max` node count.

Budget judgment:

- **Per-object** queries (single id/table) allow **no** seq scans on scaling
  catalogs except structurally unavoidable ones (each with a reason).
- **Per-schema / list** queries may need one structural scan (e.g. `pg_class`
  has no `relnamespace`-only index) — allow it with a reason and keep a time
  bound.

### Reproduce at scale locally

The default of 2000 tables keeps CI fast. To investigate closer to real incident
scale, crank the table count:

```bash
PG_META_STRESS_TABLES=12000 pnpm --filter @supabase/pg-meta test catalog-plan-guard
```

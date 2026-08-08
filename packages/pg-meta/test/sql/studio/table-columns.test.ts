import { afterAll, expect, test } from 'vitest'

import { getTableColumnsSql } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

/**
 * Equivalence guard for the scoped getTableColumnsSql path.
 *
 * The legacy shape resolved `quote_ident(nspname) || '.' || quote_ident(relname)`
 * back to an OID on every catalog row (text-overload has_table_privilege /
 * has_column_privilege, plus a ::regclass cast) and scanned pg_class twice via
 * `union all`. The scoped shape drives everything off c.oid, and short-circuits
 * the per-column privilege check when pg_attribute.attacl is null.
 *
 * That short-circuit is the only semantically interesting part: when attacl is
 * null a column's privileges come entirely from the table ACL, so the per-column
 * check is redundant. These tests pin that claim by executing BOTH renderings
 * against a fixture that deliberately exercises table-, column- and schema-level
 * grants -- there is no byte-identity snapshot, the comparison is behavioural.
 *
 * The relation set must match exactly. Two differences are intended and asserted
 * rather than smoothed over: scoped orders columns by attnum, and emits `[]`
 * where legacy emitted `[null]`.
 */

const legacySql = (vars: { table?: string; schema?: string } = {}) =>
  String(getTableColumnsSql(vars))
const scopedSql = (vars: { table?: string; schema?: string } = {}) =>
  String(getTableColumnsSql({ ...vars, scoped: true }))

// A column-level REVOKE against a table-level GRANT is a no-op in Postgres, so
// populating attacl requires explicit column-level GRANTs.
// Roles are cluster-wide while createTestDatabase() gives us a fresh database,
// so role creation has to be idempotent across test files.
const FIXTURE = `
  do $$ begin
    if not exists (select from pg_roles where rolname = 'probe_login') then
      create role probe_login login password 'probe';
    end if;
    if not exists (select from pg_roles where rolname = 'probe_group') then
      create role probe_group nologin;
    end if;
  end $$;
  grant probe_group to probe_login;

  create schema visible;
  create schema hidden;
  grant usage on schema visible to probe_group;

  -- plain table, table-wide grant: attacl null everywhere (the fast path)
  create table visible.all_cols (id bigint, name text, qty int, at timestamptz);
  grant select, insert, update, delete, truncate, references, trigger
    on visible.all_cols to probe_group;

  -- table-wide grant PLUS a column grant to another role: attacl populated,
  -- but the probe role still has table-wide access (slow path, same answer)
  create table visible.extra_colacl (id bigint, name text, secret text);
  grant select, insert, update, delete, truncate, references, trigger
    on visible.extra_colacl to probe_group;
  grant update (name) on visible.extra_colacl to probe_group;

  -- only column-level grants, no table-level: excluded by the outer
  -- has_table_privilege filter in BOTH shapes
  create table visible.col_only (id bigint, name text);
  grant select (id) on visible.col_only to probe_group;

  -- passes the outer filter but holds none of SELECT/INSERT/UPDATE/REFERENCES,
  -- so no column is visible
  create table visible.trigger_only (id bigint, v text);
  grant trigger, truncate on visible.trigger_only to probe_group;

  -- view, matview, partitioned table, dropped column
  create view visible.a_view as select id, name from visible.all_cols;
  grant select on visible.a_view to probe_group;
  create materialized view visible.a_matview as select id from visible.all_cols;
  grant select on visible.a_matview to probe_group;
  create table visible.parted (id bigint, at date) partition by range (at);
  grant select on visible.parted to probe_group;
  -- a grant on the parent does not cascade to partitions, so the children below
  -- cover both the granted and the ungranted case
  create table visible.parted_2024 partition of visible.parted
    for values from ('2024-01-01') to ('2025-01-01');
  grant select on visible.parted_2024 to probe_group;
  create table visible.parted_2025 partition of visible.parted
    for values from ('2025-01-01') to ('2026-01-01');
  create table visible.with_dropped (id bigint, gone text, kept text);
  grant select on visible.with_dropped to probe_group;
  alter table visible.with_dropped drop column gone;

  -- in a schema the probe role has no USAGE on
  create table hidden.nope (id bigint);
  grant select on hidden.nope to probe_group;
`

type Row = {
  schemaname: string
  tablename: string
  quoted_name: string
  is_table: boolean
  columns: Array<{ attname: string; data_type: string } | null>
}

const normalize = (rows: Row[]) =>
  rows
    .map((r) => ({
      key: `${r.schemaname}.${r.tablename}`,
      quoted_name: r.quoted_name,
      is_table: r.is_table,
      // legacy emits [null] where scoped emits []; compare only real columns
      cols: (r.columns ?? [])
        .filter((c): c is { attname: string; data_type: string } => c != null)
        .map((c) => `${c.attname}:${c.data_type}`),
    }))
    .sort((a, b) => a.key.localeCompare(b.key))

const withProbeDatabase = (
  name: string,
  fn: (run: <T>(sql: string) => Promise<T>) => Promise<void>
) => {
  test(
    name,
    async () => {
      const db = await createTestDatabase()
      try {
        await db.executeQuery(FIXTURE)
        // Run the introspection as the low-privilege role, not the owner --
        // a superuser short-circuits every ACL check and would hide any
        // privilege-filtering difference between the two shapes.
        const run = <T>(sql: string) =>
          db.executeQuery<T>(
            `set local role probe_login; set local search_path = pg_catalog; ${sql}`
          )
        await fn(run)
      } finally {
        await db.cleanup()
      }
    },
    60_000
  )
}

withProbeDatabase('scoped returns exactly the same relations as legacy', async (run) => {
  const legacy = normalize(await run<Row[]>(legacySql()))
  const scoped = normalize(await run<Row[]>(scopedSql()))

  expect(legacy.length).toBeGreaterThan(0)
  expect(scoped.map((r) => r.key)).toEqual(legacy.map((r) => r.key))

  // Columns compared as sets: the legacy json_agg had no ORDER BY, so its order
  // was whatever the join emitted (hash join on a small catalog, index order on a
  // large one). The scoped form pins it to attnum -- see the ordering test below.
  const scopedByKey = new Map(scoped.map((r) => [r.key, r]))
  for (const row of legacy) {
    const match = scopedByKey.get(row.key)!
    expect([...match.cols].sort(), `${row.key} column set changed`).toEqual([...row.cols].sort())
    expect(match.quoted_name).toBe(row.quoted_name)
    expect(match.is_table).toBe(row.is_table)
  }
})

withProbeDatabase(
  'neither form returns partitioned parents (follow-up, not this PR)',
  async (run) => {
    const legacy = normalize(await run<Row[]>(legacySql())).map((r) => r.key)
    const scoped = normalize(await run<Row[]>(scopedSql())).map((r) => r.key)

    // visible.parted is relkind 'p'; both filters omit it. Its children are 'r'
    // and are returned (subject to their own grants) -- see the filtering test.
    expect(legacy).not.toContain('visible.parted')
    expect(scoped).not.toContain('visible.parted')
  }
)

withProbeDatabase('scoped orders columns by attnum regardless of plan shape', async (run) => {
  const rows = normalize(await run<Row[]>(scopedSql()))

  // declared id, name, qty, at -- must come back in that order, not join order
  expect(rows.find((r) => r.key === 'visible.all_cols')!.cols).toEqual([
    'id:bigint',
    'name:text',
    'qty:integer',
    'at:timestamp with time zone',
  ])
  expect(rows.find((r) => r.key === 'visible.a_view')!.cols).toEqual(['id:bigint', 'name:text'])
})

// Privilege filtering must be identical on both sides of the flag.
for (const [label, render] of [
  ['legacy', legacySql],
  ['scoped', scopedSql],
] as const) {
  withProbeDatabase(
    `${label} applies schema, table and column privilege filtering`,
    async (run) => {
      const rows = normalize(await run<Row[]>(render()))
      const keys = rows.map((r) => r.key)

      // no USAGE on the schema
      expect(keys).not.toContain('hidden.nope')
      // column-level grants only, so it fails the table-level filter
      expect(keys).not.toContain('visible.col_only')
      // partition children are ordinary tables, included on their own grant only
      expect(keys).toContain('visible.parted_2024')
      expect(keys).not.toContain('visible.parted_2025')

      // holds TRIGGER/TRUNCATE but none of SELECT/INSERT/UPDATE/REFERENCES,
      // so it is present with no readable column
      expect(rows.find((r) => r.key === 'visible.trigger_only')!.cols).toEqual([])

      // table-wide access wins even though attacl is populated on one column
      expect(rows.find((r) => r.key === 'visible.extra_colacl')!.cols.sort()).toEqual([
        'id:bigint',
        'name:text',
        'secret:text',
      ])

      // dropped columns excluded
      expect(rows.find((r) => r.key === 'visible.with_dropped')!.cols.sort()).toEqual([
        'id:bigint',
        'kept:text',
      ])

      // views and matviews are reported as non-tables
      expect(rows.find((r) => r.key === 'visible.a_view')!.is_table).toBe(false)
      expect(rows.find((r) => r.key === 'visible.a_matview')!.is_table).toBe(false)
    }
  )

  withProbeDatabase(`${label} scoping by schema and table returns the same row`, async (run) => {
    const all = normalize(await run<Row[]>(render()))
    const one = normalize(await run<Row[]>(render({ schema: 'visible', table: 'all_cols' })))

    // Column order is compared sorted: legacy's unordered json_agg emits a
    // different order for the scoped lookup (index scan) than for the
    // whole-catalog run (hash join). Scoped pins the order; see the test above.
    const sortCols = (r?: { cols: string[] }) => r && { ...r, cols: [...r.cols].sort() }

    expect(one).toHaveLength(1)
    expect(sortCols(one[0])).toEqual(sortCols(all.find((r) => r.key === 'visible.all_cols')))
  })
}

// The empty-column-list representation is the one place the two renderings
// deliberately disagree; Studio's TableColumn type and PgSQLCompletionProvider
// both still tolerate the legacy `null` entry.
withProbeDatabase('legacy emits [null] where scoped emits []', async (run) => {
  const [legacyRow] = await run<Row[]>(legacySql({ schema: 'visible', table: 'trigger_only' }))
  const [scopedRow] = await run<Row[]>(scopedSql({ schema: 'visible', table: 'trigger_only' }))

  expect(legacyRow.columns).toEqual([null])
  expect(scopedRow.columns).toEqual([])
})

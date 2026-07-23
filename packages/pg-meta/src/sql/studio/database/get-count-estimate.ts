import { safeSql, type SafeSqlFragment } from '../../../pg-format'

export const THRESHOLD_COUNT = 50000

/**
 * Physical-size gate (bytes) for the never-analyzed (`reltuples = -1`) case.
 *
 * pg_class.reltuples is -1 until the first (auto)vacuum/analyze -- which is true
 * for BOTH a brand-new empty/small table AND a freshly bulk-loaded huge one, so
 * reltuples alone cannot distinguish them. Postgres also deliberately estimates
 * a never-vacuumed heap at a MINIMUM of 10 pages worth of rows (see
 * table_block_relation_estimate_size in src/backend/access/table/tableam.c), so
 * an EXPLAIN estimate on a truly empty table reports ~2K phantom rows.
 *
 * So for `reltuples = -1` we instead gate on the real heap size (a cheap stat()
 * of the file -- unlike pg_class.relpages, which is also stale/0 before the first
 * vacuum): at or below this many bytes an exact count(*) is subsecond by
 * construction, so we run it; only above it do we fall back to the EXPLAIN
 * estimate (non-readonly) or -1 (readonly). The size is the whole-tree heap size
 * -- pg_relation_size for a plain table, plus the pg_partition_tree sum for a
 * partitioned parent (relkind 'p'), whose own pg_relation_size is 0 while its
 * partitions hold the data -- so a large never-analyzed partitioned table is not
 * misclassified as small.
 *
 * Derived as THRESHOLD_COUNT rows at a conservative ~200 bytes/row (~10 MB); an
 * exact count over a heap that small is subsecond.
 */
export const THRESHOLD_ESTIMATE_BYTES = THRESHOLD_COUNT * 200

// FROZEN legacy path: served while the pgMetaScopedIntrospection flag is off.
// Do not edit -- it must keep matching production behavior until the flag
// cleanup deletes it. SCOPED_COUNT_ESTIMATE_SQL is the replacement.
export const COUNT_ESTIMATE_SQL: SafeSqlFragment = safeSql`
CREATE OR REPLACE FUNCTION pg_temp.count_estimate(
    query text
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
    plan jsonb;
BEGIN
    EXECUTE 'EXPLAIN (FORMAT JSON)' || query INTO plan;
    RETURN plan->0->'Plan'->'Plan Rows';
END;
$$;
`

/**
 * Scoped variant of {@link COUNT_ESTIMATE_SQL}.
 *
 * Two differences from the frozen legacy function:
 * - RETURNS bigint, not integer: the scoped unfiltered-unanalyzed path routes
 *   the very largest tables here, and EXPLAIN's Plan Rows can exceed
 *   2,147,483,647 -- the integer version raises "value out of range for type
 *   integer" while casting the return value.
 * - A DISTINCT function name (`count_estimate_big`) rather than reusing
 *   `count_estimate`. `CREATE OR REPLACE FUNCTION` cannot change an existing
 *   function's return type (it errors "cannot change return type of existing
 *   function"), and pg_temp functions live for the whole session. A pooled
 *   connection that already served a legacy (integer) count query would error
 *   on the scoped (bigint) CREATE OR REPLACE if they shared the name. A separate
 *   name lets both coexist harmlessly on one session during the flag rollout.
 */
export const SCOPED_COUNT_ESTIMATE_SQL: SafeSqlFragment = safeSql`
CREATE OR REPLACE FUNCTION pg_temp.count_estimate_big(
    query text
) RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE
    plan jsonb;
BEGIN
    EXECUTE 'EXPLAIN (FORMAT JSON)' || query INTO plan;
    RETURN plan->0->'Plan'->'Plan Rows';
END;
$$;
`

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

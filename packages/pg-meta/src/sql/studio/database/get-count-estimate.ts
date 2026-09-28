import { safeSql, type SafeSqlFragment } from '../../../pg-format'

export const THRESHOLD_COUNT = 50000

/**
 * Heap-size gate (bytes) for the never-analyzed (reltuples = -1) case, which
 * covers BOTH an empty/small new table and a bulk-loaded huge one. Gate on the
 * real heap size (pg_relation_size, + pg_partition_tree sum for a partitioned
 * parent whose own size is 0; relpages is equally stale pre-vacuum): at/below ->
 * exact count(*), above -> EXPLAIN estimate. ~10 MB = THRESHOLD_COUNT rows at a
 * conservative ~200 bytes/row (an exact count over that is subsecond).
 */
export const THRESHOLD_ESTIMATE_BYTES = THRESHOLD_COUNT * 200

// FROZEN legacy path: served while the pgMetaScopedIntrospection flag is off.
// Do not edit -- it must keep matching production behavior until the flag
// cleanup deletes it. The scoped path reuses this same function.
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

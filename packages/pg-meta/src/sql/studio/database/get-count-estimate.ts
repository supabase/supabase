import { safeSql, type SafeSqlFragment } from '../../../pg-format'

export const THRESHOLD_COUNT = 50000

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

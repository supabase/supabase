import { literal, safeSql, SafeSqlFragment } from '../../../pg-format'

const GET_POLICIES_FOR_QUERY_SQL: SafeSqlFragment = safeSql`
CREATE OR REPLACE FUNCTION pg_temp.get_policies_for_query(
  query text,
  test_role text
)
RETURNS TABLE(tablename text, policyname text, cmd text, qual text, with_check text)
LANGUAGE plpgsql AS $$
DECLARE
  tables text[];
  explain_output json;
BEGIN
  -- Use EXECUTE to run EXPLAIN dynamically
  EXECUTE 'EXPLAIN (FORMAT JSON) ' || query INTO explain_output;

  -- Extract table names from the plan
  SELECT ARRAY(
    SELECT DISTINCT rel->>'Relation Name'
    FROM jsonb_path_query(
      explain_output::jsonb,
      'strict $.**."Relation Name"'
    ) as rel
  ) INTO tables;

  -- Return matching policies
  RETURN QUERY
  SELECT p.tablename::text, p.policyname::text, p.cmd::text, p.qual::text, p.with_check::text
  FROM pg_policies p
  WHERE p.tablename = ANY(tables)
  AND (
    p.roles = '{}'
    OR test_role = ANY(p.roles)
  )
  ORDER BY p.tablename, p.policyname;
END;
$$;
`

export const getEvaluatedPoliciesForQuery = ({
  sql,
  role,
}: {
  sql: string
  role: 'anon' | 'authenticated'
}) => {
  return safeSql`
${GET_POLICIES_FOR_QUERY_SQL}
SELECT * FROM pg_temp.get_policies_for_query(${literal(sql)}, ${literal(role)});
  `
}

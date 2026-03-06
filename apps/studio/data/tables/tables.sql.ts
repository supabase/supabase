/**
 * Given a schema name, list all the tables in that schema which have access
 * granted to either the "anon" or "authenticated" role
 */
export const getTablesWithAnonAuthenticatedAccessSQL = ({ schema }: { schema: string }) =>
  /* SQL */ `
SELECT c.relname AS table_name
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = '${schema}'
  AND c.relkind IN ('r','p')  -- table, partitioned table
  AND EXISTS (
    SELECT 1
    FROM pg_catalog.aclexplode(COALESCE(c.relacl, '{}'::aclitem[])) AS a
    JOIN pg_catalog.pg_roles r ON r.oid = a.grantee
    WHERE r.rolname IN ('anon','authenticated')
  )
;
`.trim()

/**
 * Given a schema name, list all the tables in that schema which have access
 * granted to either the "anon" or "authenticated" role
 */
export const getTablesWithAnonAuthenticatedAccessSQL = ({ schema }: { schema: string }) =>
  /* SQL */ `
SELECT DISTINCT table_name
FROM information_schema.role_table_grants
WHERE table_schema = '${schema}'
AND grantee IN ('anon','authenticated')
`.trim()


// [Joshen] For a specified schema, checks for each table if they're exposed via the
// Supabase API based on the roles "anon" and "authenticated"
export const getTablesAnonAuthenticatedRolesAccessSQL = ({ schema }: { schema: string }) =>
  /* SQL */ `
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = '${schema}'
  AND grantee IN ('anon', 'authenticated');
`.trim()

/**
 * Given a schema name, list all the tables in that schema which have access
 * granted to either the "anon" or "authenticated" role.
 *
 * Checks two sources:
 * 1. Explicit grants on the table (pg_class.relacl) — used by cloud Supabase and any
 *    table created after an explicit GRANT was issued.
 * 2. Schema-level default privileges (pg_default_acl) — used by local Supabase CLI which
 *    bootstraps via ALTER DEFAULT PRIVILEGES. Tables created before those defaults were set
 *    may have a NULL relacl but the schema-level defaults still represent the intended access.
 */
export const getTablesWithAnonAuthenticatedAccessSQL = ({ schema }: { schema: string }) =>
  /* SQL */ `
SELECT c.relname AS table_name
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = '${schema}'
  AND c.relkind IN ('r','p')  -- table, partitioned table
  AND (
    -- Explicit table-level grant to anon or authenticated
    EXISTS (
      SELECT 1
      FROM pg_catalog.aclexplode(COALESCE(c.relacl, '{}'::aclitem[])) AS a
      LEFT JOIN pg_catalog.pg_roles r ON r.oid = a.grantee
      WHERE r.rolname IN ('anon','authenticated')
         OR a.grantee = 0  -- PUBLIC pseudo-role (inherited by all roles)
    )
    OR
    -- Schema-level default privileges grant anon or authenticated access to tables
    -- (covers local Supabase CLI which uses ALTER DEFAULT PRIVILEGES)
    EXISTS (
      SELECT 1
      FROM pg_catalog.pg_default_acl da
      JOIN pg_catalog.pg_namespace dn ON dn.oid = da.defaclnamespace
      CROSS JOIN pg_catalog.aclexplode(da.defaclacl) AS a
      LEFT JOIN pg_catalog.pg_roles r ON r.oid = a.grantee
      WHERE dn.nspname = n.nspname
        AND da.defaclobjtype = 'r'  -- 'r' = tables
        AND (r.rolname IN ('anon','authenticated') OR a.grantee = 0)
    )
  )
;
`.trim()

-- Tests role privileges on the vault objects
-- INSERT and UPDATE privileges should not be present on the vault tables for postgres and service_role, only SELECT and DELETE
WITH schema_obj AS (
  SELECT oid, nspname
  FROM pg_namespace
  WHERE nspname = 'vault'
)
SELECT
  s.nspname AS schema,
  c.relname AS object_name,
  acl.grantee::regrole::text AS grantee,
  acl.privilege_type
FROM pg_class c
JOIN schema_obj s ON s.oid = c.relnamespace
CROSS JOIN LATERAL aclexplode(c.relacl) AS acl
WHERE c.relkind IN ('r', 'v', 'm', 'f', 'p')
  AND acl.privilege_type <> 'MAINTAIN'
UNION ALL
SELECT
  s.nspname AS schema,
  p.proname AS object_name,
  acl.grantee::regrole::text AS grantee,
  acl.privilege_type
FROM pg_proc p
JOIN schema_obj s ON s.oid = p.pronamespace
CROSS JOIN LATERAL aclexplode(p.proacl) AS acl
ORDER BY object_name, grantee, privilege_type;

-- vault indexes with owners
SELECT
    ns.nspname AS schema,
    t.relname AS table,
    i.relname AS index_name,
    r.rolname AS index_owner,
    CASE
        WHEN idx.indisunique THEN 'Unique'
        ELSE 'Non Unique'
    END AS index_type
FROM
    pg_class t
JOIN
    pg_namespace ns ON t.relnamespace = ns.oid
JOIN
    pg_index idx ON t.oid = idx.indrelid
JOIN
    pg_class i ON idx.indexrelid = i.oid
JOIN
    pg_roles r ON i.relowner = r.oid
WHERE
    ns.nspname = 'vault'
ORDER BY
    t.relname,
    i.relname;

-- assert search_path is preserved after after-create script is run
show search_path;

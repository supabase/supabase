-- CVE-2025-12817: CREATE STATISTICS did not check CREATE privilege on the
-- schema where the statistics object is created, letting a table owner create
-- statistics objects in any schema (naming-conflict / privilege concern).
--
-- Upstream commits: 2393d374 + d202ec1f (PG 15.15), e2fb3dfa (PG 17.7). The fix
-- adds a pg_namespace_aclcheck(namespaceId, GetUserId(), ACL_CREATE).
--
-- Verified as a non-superuser table owner. Refs: PSQL-1110, PSQL-1234.

BEGIN;

CREATE SCHEMA owned_ns;
CREATE SCHEMA forbidden_ns;
-- postgres can create in owned_ns only; it has no rights on forbidden_ns.
GRANT CREATE, USAGE ON SCHEMA owned_ns TO postgres;

SET ROLE postgres;

-- A table postgres owns, in a schema postgres controls.
CREATE TABLE owned_ns.stat_tbl (a int, b int);
INSERT INTO owned_ns.stat_tbl SELECT g % 10, g % 5 FROM generate_series(1, 100) g;

-- Positive control: stats object in owned_ns (postgres has CREATE) is allowed.
CREATE STATISTICS owned_ns.okstat (dependencies) ON a, b FROM owned_ns.stat_tbl;

-- The fix: a stats object targeting a schema where postgres lacks CREATE is denied.
SAVEPOINT no_priv;
CREATE STATISTICS forbidden_ns.badstat (dependencies) ON a, b FROM owned_ns.stat_tbl;
ROLLBACK TO SAVEPOINT no_priv;

RESET ROLE;

ROLLBACK;

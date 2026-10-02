-- Pin CVE-2026-2004 behaviour: attaching a non-built-in selectivity estimator
-- to an operator requires superuser. Verified against both RESTRICT and JOIN.
--
-- Upstream commits: b764b26f (PG 15.16), bbf5bcf5 (PG 17.8). The check fires in
-- both ValidateRestrictionEstimator() and ValidateJoinEstimator() in
-- src/backend/commands/operatorcmds.c.
--
-- We use real non-built-in estimators shipped by intarray (_int_matchsel for
-- RESTRICT, _int_overlap_joinsel for JOIN) -- these are exactly the customer-
-- reachable estimators the CVE-2026-2004 fleet-scan query targets.
--
-- Refs: PSQL-1110, PSQL-1234.

BEGIN;

SET client_min_messages = warning; -- cli does not have intarray but others do, avoid the notice
CREATE EXTENSION IF NOT EXISTS intarray; -- cli

-- A schema the non-superuser controls, so CREATE OPERATOR reaches the estimator
-- validation rather than failing an earlier schema-permission check.
CREATE SCHEMA op_ns;
GRANT CREATE, USAGE ON SCHEMA op_ns TO postgres;

-- Trivial boolean procedure for the operator (no internal args -> valid in SQL).
CREATE FUNCTION op_ns.fake_op_proc(_int4, _int4)
  RETURNS bool LANGUAGE sql IMMUTABLE AS $$ SELECT true $$;

-- Switch to a non-superuser role.
SET ROLE postgres;

-- 1) RESTRICT = non-built-in estimator should be rejected.
SAVEPOINT before_restrict;
CREATE OPERATOR op_ns.@@@ (
  LEFTARG = _int4, RIGHTARG = _int4,
  PROCEDURE = op_ns.fake_op_proc,
  RESTRICT = _int_matchsel
);
ROLLBACK TO SAVEPOINT before_restrict;

-- 2) JOIN = non-built-in estimator should be rejected.
SAVEPOINT before_join;
CREATE OPERATOR op_ns.@@@ (
  LEFTARG = _int4, RIGHTARG = _int4,
  PROCEDURE = op_ns.fake_op_proc,
  JOIN = _int_overlap_joinsel
);
ROLLBACK TO SAVEPOINT before_join;

-- 3) Sanity check: built-in selectivity estimators still work for non-superusers.
CREATE OPERATOR op_ns.@@@ (
  LEFTARG = _int4, RIGHTARG = _int4,
  PROCEDURE = op_ns.fake_op_proc,
  RESTRICT = eqsel,
  JOIN = eqjoinsel
);
DROP OPERATOR op_ns.@@@ (_int4, _int4);

RESET ROLE;

RESET client_min_message;
ROLLBACK;

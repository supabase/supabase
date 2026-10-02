-- CVE-2026-6473
-- 
-- Overflow of the internal "left" / length / variant-count fields used
-- when parsing contrib intarray query_int and contrib ltree ltxtquery /
-- lquery. Pre-fix (<= 15.18 / 17.9) a sufficiently large query was
-- accepted and silently built a corrupt parse tree; the fixed builds
-- (15.19 / 17.11) reject it with a clean error.
--
-- Upstream fixes and their own regress tests (contrib/intarray/sql/_int.sql,
-- contrib/ltree/sql/ltree.sql):
--   query_int + ltxtquery "left" overflow:
--     84a9f264  https://github.com/postgres/postgres/commit/84a9f264
--   lquery totallen / numvar overflow:
--     9c2fa5b6  https://github.com/postgres/postgres/commit/9c2fa5b6
-- 
-- The reproducers below are those upstream tests. They must use FLAT
-- operator chains (built with string_agg / repeat): the query grammar
-- parses a flat chain iteratively, so it reaches the overflow guard,
-- whereas a deeply nested expression would trip check_stack_depth() first
-- (identically on both builds).
--
-- Refs: PSQL-1110, PSQL-1234.

BEGIN;

SET client_min_messages = warning; -- cli does not have ltree so does not show the already exists notice
CREATE EXTENSION IF NOT EXISTS intarray;
CREATE EXTENSION IF NOT EXISTS ltree;

-- Functional sanity: well-formed queries still parse and match on both builds.
SELECT '{1,2,3}'::int[] @@ '2&4'::query_int AS q_and; -- false
SELECT '{1,2,3}'::int[] @@ '2|4'::query_int AS q_or; -- true
SELECT 'Top.Science.Astronomy'::ltree ~ 'Top.*.Astronomy'::lquery AS lquery_match; -- true
SELECT 'Top.Science.Astronomy'::ltree @ 'Astronomy & Top'::ltxtquery AS ltxtquery_match; -- true

-- query_int: 17000 AND'd terms overflow the int16 "left" offset field.
SELECT (SELECT '0 | ' || string_agg(i::text, ' & ')
        FROM generate_series(1, 17000) AS i)::query_int IS NOT NULL AS q_int_overflow;

-- ltxtquery: same flat-chain shape overflows the ltxtquery size field.
SELECT (SELECT 'a | ' || string_agg('b', ' & ')
        FROM generate_series(1, 17000) AS i)::ltxtquery IS NOT NULL AS ltxt_overflow;

-- lquery: too many OR-variants in a single level.
SELECT (repeat('a|', 65535) || 'a')::lquery IS NOT NULL AS lq_numvar;

RESET client_min_messages;
ROLLBACK;

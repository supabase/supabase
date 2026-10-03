-- contrib/ltree: an integer overflow in ltree_compare() made comparisons return
-- the wrong sign once two values differed in depth by more than ~14,653 labels.
-- A btree index over such values could therefore be built in the wrong order and
-- needs a REINDEX after upgrade. Fixed in PG 15.19 / 17.11 (2026-08-13) by
-- dropping the overflowing "* 10 * (an + 1)" scaling from the comparator's
-- return values.
--
-- This reproduces the bug index-free, straight through the btree ordering
-- operators: `a` is a deep value (20,001 labels) whose leading label equals the
-- shallow value `b`, so `b` is a proper prefix of `a` and therefore `a > b` must
-- hold. Pre-fix, the final "(a->numlevel - b->numlevel) * 10 * (an + 1)" term
-- overflows int32 for that depth gap and flips sign, so `a > b` wrongly returns
-- false and `a < b` wrongly returns true. `b < a` stays correct pre-fix (the
-- shorter operand exhausts the loop first, so no scaling overflow occurs), which
-- makes the pre-fix result internally contradictory.
--
-- Refs: PSQL-1110, PSQL-1234.

BEGIN;

SET client_min_messages = warning; -- cli does not have ltree so does not show the already exists notice
CREATE EXTENSION IF NOT EXISTS ltree;

WITH v AS (
  SELECT (repeat('a.', 20000) || 'a')::ltree AS a,   -- 20,001 labels
         'a'::ltree                          AS b     -- 1 label, a prefix of a
)
SELECT nlevel(a) AS na,
       nlevel(b) AS nb,
       a > b     AS a_gt_b,   -- must be TRUE  (a extends prefix b)
       a < b     AS a_lt_b,   -- must be FALSE
       b < a     AS b_lt_a,   -- must be TRUE
       a = a     AS a_eq_a    -- must be TRUE
FROM v;

ROLLBACK;

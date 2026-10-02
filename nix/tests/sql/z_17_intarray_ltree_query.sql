BEGIN;

SET client_min_messages = warning; -- cli does not have ltree so does not show the already exists notice
CREATE EXTENSION IF NOT EXISTS ltree;

-- lquery: total length of one level's OR-variants overflows.
SELECT (repeat('x', 1000) || repeat('|' || repeat('x', 1000), 65))::lquery IS NOT NULL AS lq_totallen;

RESET client_min_messages;
ROLLBACK;

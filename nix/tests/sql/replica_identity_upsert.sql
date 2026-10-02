-- 17.7/15.15 tightened logical-replication checks: MERGE and
-- INSERT ... ON CONFLICT DO UPDATE now also require a REPLICA IDENTITY when the
-- target table is in a publication that publishes updates (previously these two
-- paths could slip through, unlike a plain UPDATE). Pins the post-fix behavior:
-- both error without a replica identity, and succeed once one is set.
--
-- Refs: PSQL-1110, PSQL-1234.

BEGIN;

CREATE TABLE ri (id int UNIQUE, v int);
CREATE PUBLICATION pub_ri FOR TABLE ri;
INSERT INTO ri VALUES (1, 10);

-- No replica identity yet: both write paths must be rejected.
SAVEPOINT s_upsert;
INSERT INTO ri VALUES (1, 20) ON CONFLICT (id) DO UPDATE SET v = EXCLUDED.v;
ROLLBACK TO SAVEPOINT s_upsert;

SAVEPOINT s_merge;
MERGE INTO ri t USING (SELECT 1 AS id, 30 AS v) s ON t.id = s.id
  WHEN MATCHED THEN UPDATE SET v = s.v;
ROLLBACK TO SAVEPOINT s_merge;

-- With a replica identity, both succeed.
ALTER TABLE ri REPLICA IDENTITY FULL;
INSERT INTO ri VALUES (1, 20) ON CONFLICT (id) DO UPDATE SET v = EXCLUDED.v;
MERGE INTO ri t USING (SELECT 1 AS id, 30 AS v) s ON t.id = s.id
  WHEN MATCHED THEN UPDATE SET v = s.v;
SELECT v FROM ri WHERE id = 1;

ROLLBACK;

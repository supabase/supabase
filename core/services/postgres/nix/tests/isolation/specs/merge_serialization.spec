# Pins the upstream fix (PG 15.16 / 17.8) where MERGE must raise a
# serialization failure (SQLSTATE 40001) under REPEATABLE READ when its target
# row was updated and committed by a concurrent transaction after the MERGE
# transaction took its snapshot. Before the fix this concurrent-update check
# was silently skipped for MERGE (unlike a plain UPDATE).
#
# s1 opens a REPEATABLE READ transaction and takes its snapshot (s1_snapshot);
# s2 then updates+commits the row; s1's MERGE on that row must fail with 40001.

setup
{
  CREATE TABLE merge_target (k int PRIMARY KEY, v int);
  INSERT INTO merge_target VALUES (1, 0);
}

teardown
{
  DROP TABLE merge_target;
}

session s1
step s1_begin    { BEGIN ISOLATION LEVEL REPEATABLE READ; }
step s1_snapshot { SELECT v FROM merge_target WHERE k = 1; }
step s1_merge    { MERGE INTO merge_target t
                     USING (SELECT 1 AS k) s ON t.k = s.k
                     WHEN MATCHED THEN UPDATE SET v = t.v + 1; }
step s1_commit   { COMMIT; }

session s2
step s2_update   { UPDATE merge_target SET v = v + 100 WHERE k = 1; }

permutation s1_begin s1_snapshot s2_update s1_merge s1_commit

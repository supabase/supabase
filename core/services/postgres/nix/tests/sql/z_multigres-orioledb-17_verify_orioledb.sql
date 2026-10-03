-- Verify OrioleDB is actually loaded and working
-- This test will FAIL if orioledb is not properly configured

-- Check orioledb access method exists
SELECT amname FROM pg_am WHERE amname = 'orioledb';

-- Check orioledb is in shared_preload_libraries
SELECT setting LIKE '%orioledb%' AS orioledb_preloaded
FROM pg_settings WHERE name = 'shared_preload_libraries';

-- Create a table using orioledb access method
CREATE TABLE test_orioledb_verify (
    id int PRIMARY KEY,
    data text
) USING orioledb;

-- Verify it's actually using orioledb storage
SELECT relname, amname
FROM pg_class c
JOIN pg_am a ON c.relam = a.oid
WHERE relname = 'test_orioledb_verify';

-- Cleanup
DROP TABLE test_orioledb_verify;

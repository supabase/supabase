-- Non-CVE behavior change: the hstore receive function had a NULL-pointer
-- dereference (backend crash) on COPY BINARY of an hstore whose binary form
-- contains a DUPLICATE key where the second occurrence's value is NULL.
--
-- Upstream commits: 63c05e03 (PG 15.x), 0dfbe42d (PG 17.x).
--
-- A normal INSERT cannot reproduce this: hstore de-duplicates on text input, so
-- a stored value never carries a duplicate key into the binary path. We instead
-- hand-craft a COPY-BINARY stream whose single hstore field contains the pair
-- sequence [ 'a' => '1', 'a' => NULL ] and feed it through hstore_recv via
-- COPY ... FROM. Pre-fix this crashed the backend; on the fixed builds the
-- duplicate is de-duplicated and the row loads cleanly.
--
-- pg_regress runs as the superuser supabase_admin, so lo_export / server-side
-- COPY FROM a file are permitted. Refs: PSQL-1110, PSQL-1234.

BEGIN;

CREATE TABLE hstore_dst (h hstore);

-- Materialise the crafted COPY-BINARY stream to a file (created and exported in
-- separate statements so the large object is visible to lo_export).
SELECT lo_from_bytea(81000,
  '\x5047434f50590aff0d0a00'::bytea ||            -- COPY binary signature
  '\x00000000'::bytea || '\x00000000'::bytea ||   -- flags + header-extension length
  '\x0001'::bytea || '\x00000017'::bytea ||       -- one row, one field of length 23
  '\x00000002'::bytea ||                           -- hstore: 2 pairs
  '\x00000001'::bytea||'\x61'::bytea||'\x00000001'::bytea||'\x31'::bytea ||  -- 'a' => '1'
  '\x00000001'::bytea||'\x61'::bytea||'\xffffffff'::bytea ||                  -- 'a' => NULL
  '\xffff'::bytea) AS loid;                         -- COPY trailer
SELECT lo_export(81000, '/tmp/pg_regress_hstore_dup.bin') AS exported;

-- Must not crash the backend; the duplicate key is de-duplicated on receive.
COPY hstore_dst FROM '/tmp/pg_regress_hstore_dup.bin' WITH (FORMAT binary);

SELECT h AS received, akeys(h) AS keys FROM hstore_dst;

ROLLBACK;

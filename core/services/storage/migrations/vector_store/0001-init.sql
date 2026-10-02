-- Initial schema for the pgvector-backed vector store.
-- Creates the extension and the dedicated `storage_vectors` schema where the
-- pgvector adapter will materialise one table per (bucket, index) pair at
-- runtime via CREATE TABLE.
--
-- This migration only runs when VECTOR_BUCKET_PROVIDER=pgvector and
-- VECTOR_STORE_MIGRATIONS_ENABLED=true (gated by the migration runner).
--
-- The pgvector extension MUST live in a schema present in the runtime
-- connection's search_path (storage, public, extensions, …). We pin it to
-- `public` because it's guaranteed to exist on every Postgres install.

CREATE EXTENSION IF NOT EXISTS vector SCHEMA public;

-- halfvec (introduced in pgvector 0.7.0) is required: it's the storage type
-- used for index columns so HNSW can index up to 4000 dimensions and embeddings
-- take ~2 bytes/dim instead of 4. Fail fast with a clear message on older
-- pgvector versions rather than later at first CREATE TABLE with an opaque
-- "type halfvec does not exist".
DO $$
DECLARE
  v text;
BEGIN
  SELECT extversion INTO v FROM pg_extension WHERE extname = 'vector';
  IF v IS NULL THEN
    RAISE EXCEPTION 'pgvector extension is not installed';
  END IF;
  IF string_to_array(v, '.')::int[] < ARRAY[0, 7, 0]::int[] THEN
    RAISE EXCEPTION 'pgvector >= 0.7.0 required for halfvec storage, found %', v;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS storage_vectors;

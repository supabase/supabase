-- postgres-migrations disable-transaction
-- postgres-migrations ignore
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_name_bucket_level_unique on storage.objects (name COLLATE "C", bucket_id, level);

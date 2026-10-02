-- postgres-migrations disable-transaction
-- postgres-migrations ignore
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_lower_name ON storage.objects ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);

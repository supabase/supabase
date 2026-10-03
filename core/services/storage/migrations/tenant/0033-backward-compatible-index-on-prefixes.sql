-- postgres-migrations disable-transaction
-- postgres-migrations ignore
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prefixes_lower_name ON storage.prefixes (bucket_id, level, ((string_to_array(name, '/'))[level]), lower(name) text_pattern_ops);

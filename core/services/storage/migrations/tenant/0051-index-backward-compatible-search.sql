-- postgres-migrations disable-transaction
-- Create index for case-insensitive name search in storage.search function
-- Must use COLLATE "C" to match the query comparisons for index usage
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_bucket_id_name_lower
    ON storage.objects (bucket_id, (lower(name) COLLATE "C"));
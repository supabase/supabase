-- postgres-migrations disable-transaction

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_null_version
    ON storage.objects (bucket_id, name COLLATE "C") WHERE NOT is_versioned;

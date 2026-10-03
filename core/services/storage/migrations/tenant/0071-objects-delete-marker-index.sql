-- postgres-migrations disable-transaction

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_objects_delete_markers
    ON storage.objects (bucket_id, name COLLATE "C") WHERE is_delete_marker;

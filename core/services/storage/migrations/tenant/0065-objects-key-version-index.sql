-- storage-migrations generate-sql
-- Return the statement so CONCURRENTLY runs outside a DO block or transaction.
SELECT '-- postgres-migrations disable-transaction' || E'\n' ||
    CASE WHEN current_setting('server_version_num')::integer >= 150000 THEN
        $sql$
        CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS objects_bucket_id_name_version_key
            ON storage.objects (bucket_id, name COLLATE "C", version) NULLS NOT DISTINCT;
        $sql$
    ELSE
        $sql$
        CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS objects_bucket_id_name_version_key
            ON storage.objects (
                (bucket_id IS NULL), (COALESCE(bucket_id, '')),
                (name IS NULL), (COALESCE(name, '') COLLATE "C"),
                (version IS NULL), (COALESCE(version, ''))
            );
        $sql$
    END AS sql;

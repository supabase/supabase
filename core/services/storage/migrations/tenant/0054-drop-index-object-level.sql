-- postgres-migrations disable-transaction
DROP INDEX CONCURRENTLY IF EXISTS objects_bucket_id_level_idx;

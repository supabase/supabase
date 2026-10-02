-- postgres-migrations disable-transaction
DROP INDEX CONCURRENTLY IF EXISTS idx_objects_lower_name;
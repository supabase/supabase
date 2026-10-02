-- postgres-migrations disable-transaction

DROP INDEX CONCURRENTLY IF EXISTS storage.bucketid_objname;

import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const LARGEST_SIZE_LIMIT_BUCKETS_COUNT = 50

/**
 * SQL to get the storage buckets with the largest file size limits.
 *
 * This query is unoptimized and should not be automatically called because
 * there is no index on `file_size_limit` in the `storage.buckets` table.
 */
export const getLargestSizeLimitBucketsSqlUnoptimized: SafeSqlFragment = safeSql`
SELECT id, name, file_size_limit
FROM storage.buckets
WHERE file_size_limit IS NOT NULL
ORDER BY file_size_limit DESC
LIMIT ${literal(LARGEST_SIZE_LIMIT_BUCKETS_COUNT + 1)};
`

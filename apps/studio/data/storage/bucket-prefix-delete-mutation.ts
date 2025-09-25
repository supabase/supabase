import { executeSql } from 'data/sql/execute-sql-query'

/**
 * [Joshen] JFYI this is solely being used in storage-explorer.tsx and hence doesn't have a useMutation hook
 * It's solely supposed to aid users to self-remediate a known issue with orphan prefixes so the condition to
 * clean the prefix from the storage.prefixes is intentionally strict here (e.g only level 1)
 *
 * We can make this a bit more loose if needed, but ideal case is that this issue is addressed at the storage level
 */

type DeleteBucketPrefixParams = {
  projectRef?: string
  connectionString?: string
  bucketId?: string
  prefix?: string
}
export const deleteBucketPrefix = async (
  { projectRef, connectionString, bucketId, prefix }: DeleteBucketPrefixParams,
  signal?: AbortSignal
) => {
  if (!projectRef) throw new Error('projectRef is required')
  if (!connectionString) throw new Error('connectionString is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!prefix) throw new Error('prefix is required')

  const sql = /* SQL */ `
select storage.delete_prefix('${bucketId}', '${prefix}');
`.trim()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['delete-bucket-prefix'] },
    signal
  )

  return result
}

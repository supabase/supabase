import { literal, safeSql } from '../../../pg-format'

export const getDeleteBucketPrefixSQL = ({
  bucketId,
  prefix,
}: {
  bucketId: string
  prefix: string
}) => {
  const sql = safeSql`
    -- source: dashboard
    -- description: Delete all storage objects matching a prefix within a bucket
    select storage.delete_prefix(${literal(bucketId)}, ${literal(prefix)});
  `

  return sql
}

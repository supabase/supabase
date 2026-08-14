import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getDeleteBucketPrefixSQL = ({
  bucketId,
  prefix,
}: {
  bucketId: string
  prefix: string
}): SafeSqlFragment => {
  return safeSql`select storage.delete_prefix(${literal(bucketId)}, ${literal(prefix)});`
}

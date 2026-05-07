export const getDeleteBucketPrefixSQL = ({
  bucketId,
  prefix,
}: {
  bucketId: string
  prefix: string
}) => {
  const sql = /* SQL */ `
select storage.delete_prefix('${bucketId}', '${prefix}');
`.trim()
  return sql
}

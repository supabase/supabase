import { ident, joinSqlFragments, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getCreatePublicationSQL = ({
  name,
  tables,
}: {
  name: string
  tables: { schema: string; name: string }[]
}): SafeSqlFragment => {
  const query =
    tables.length > 0
      ? safeSql`FOR TABLE ONLY ${joinSqlFragments(
          tables.map(({ schema, name }) => safeSql`${ident(schema)}.${ident(name)}`),
          ', '
        )} `
      : safeSql``

  return safeSql`CREATE PUBLICATION ${ident(name)} ${query}WITH (publish_via_partition_root = true)`
}

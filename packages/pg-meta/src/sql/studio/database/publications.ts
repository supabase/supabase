import { ident } from '../../../pg-format'

export const getCreatePublicationSQL = ({
  name,
  tables,
}: {
  name: string
  tables: { schema: string; name: string }[]
}) => {
  const query =
    tables.length > 0
      ? `FOR TABLE ONLY ${tables.map(({ schema, name }) => `${ident(schema)}.${ident(name)}`).join(', ')} `
      : ''

  return `CREATE PUBLICATION ${ident(name)} ${query}WITH (publish_via_partition_root = true)`
}

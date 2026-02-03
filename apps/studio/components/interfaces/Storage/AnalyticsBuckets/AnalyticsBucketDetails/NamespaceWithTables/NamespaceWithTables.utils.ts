import { snakeCase } from 'lodash'

import { ReplicationPublication } from 'data/replication/publications-query'

export const inferPostgresTableFromNamespaceTable = ({
  publication,
  tableName,
}: {
  publication?: ReplicationPublication
  tableName: string
}) => {
  return publication?.tables.find((x) => tableName === snakeCase(`${x.schema}.${x.name}_changelog`))
}

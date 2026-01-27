import { ReplicationPublication } from 'data/replication/publications-query'
import { snakeCase } from 'lodash'

export const inferPostgresTableFromNamespaceTable = ({
  publication,
  tableName,
}: {
  publication?: ReplicationPublication
  tableName: string
}) => {
  return publication?.tables.find((x) => tableName === snakeCase(`${x.schema}.${x.name}_changelog`))
}

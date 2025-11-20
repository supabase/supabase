import { snakeCase } from 'lodash'

import { ReplicationPublication } from 'data/etl/publications-query'

export const inferPostgresTableFromNamespaceTable = ({
  publication,
  tableName,
}: {
  publication?: ReplicationPublication
  tableName: string
}) => {
  return publication?.tables.find((x) => tableName === snakeCase(`${x.schema}.${x.name}_changelog`))
}

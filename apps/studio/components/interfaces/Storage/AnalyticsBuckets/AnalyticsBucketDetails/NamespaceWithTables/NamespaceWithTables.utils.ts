import { snakeCase } from 'lodash'

import { ReplicationPublicationData } from '@/data/replication/publication-query'

export const inferPostgresTableFromNamespaceTable = ({
  publication,
  tableName,
}: {
  publication?: ReplicationPublicationData
  tableName: string
}) => {
  return publication?.tables.find((x) => tableName === snakeCase(`${x.schema}.${x.name}_changelog`))
}

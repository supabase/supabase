import { z } from 'zod'

import { getReplicationDestinationType } from './Nodes.utils'
import type { ReplicationDestinationsData } from '@/data/replication/destinations-query'

const bigQueryDatasetSchema = z.object({
  big_query: z.object({ project_id: z.string().min(1), dataset_id: z.string().min(1) }),
})

export function getOverviewDestination({
  destination,
  destinationId,
  clusterId,
}: {
  destination?: ReplicationDestinationsData['destinations'][number]
  destinationId: number
  clusterId?: string
}) {
  const type = getReplicationDestinationType(destination?.config)
  const dataset = bigQueryDatasetSchema.safeParse(destination?.config)
  if (dataset.success) {
    const { project_id, dataset_id } = dataset.data.big_query
    return {
      id: JSON.stringify(['BigQuery', project_id, dataset_id]),
      type,
      projectId: project_id,
      datasetId: dataset_id,
      label: `${project_id}.${dataset_id}`,
    }
  }
  const clickhouse = z
    .object({ clickhouse: z.object({ url: z.string().url(), database: z.string().min(1) }) })
    .safeParse(destination?.config)
  if (clickhouse.success) {
    const { url, database } = clickhouse.data.clickhouse
    const endpoint = new URL(url)
    return {
      id: JSON.stringify(['ClickHouse', endpoint.origin, database]),
      type,
      host: endpoint.host,
      databaseName: database,
      label: `${endpoint.host} / ${database}`,
    }
  }
  return {
    id: JSON.stringify(['destination', clusterId ?? 'default', destinationId]),
    type,
    label: destination?.name,
  }
}

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
  return {
    id: JSON.stringify(['destination', clusterId ?? 'default', destinationId]),
    type,
    label: destination?.name,
  }
}

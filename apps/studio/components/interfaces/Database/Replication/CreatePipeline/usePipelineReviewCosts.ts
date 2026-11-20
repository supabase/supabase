import { useParams } from 'common'
import { useWatch, type Control } from 'react-hook-form'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { buildTableSyncCopyConfig } from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import {
  useReplicationCostEstimateQuery,
  type ReplicationCostEstimateData,
} from '@/data/replication/cost-estimate-query'
import type { ReplicationPublicationData } from '@/data/replication/publication-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'
import type { TableSyncCopyConfig } from '@/data/replication/types'

type PipelineReviewCostsState = { isInitialCostEstimateLoading: boolean } & (
  | { status: 'missing-publication' }
  | { status: 'missing-selection' }
  | {
      status: 'estimate'
      estimate?: ReplicationCostEstimateData
      publicationTables: ReplicationPublicationData['tables']
      tableSyncCopy: TableSyncCopyConfig
    }
)

const getTableSyncCopy = (
  params: Parameters<typeof buildTableSyncCopyConfig>[0]
): TableSyncCopyConfig | undefined => {
  try {
    return buildTableSyncCopyConfig(params)
  } catch {
    // An incomplete initial sync selection has no estimate to request.
    return undefined
  }
}

export const usePipelineReviewCosts = ({
  control,
  publication,
  enabled = true,
}: {
  control: Control<DestinationPanelSchemaType>
  publication?: ReplicationPublicationData
  enabled?: boolean
}): PipelineReviewCostsState => {
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })
  const [publicationName, mode, ids] = useWatch({
    control,
    name: ['publicationName', 'tableSyncCopyMode', 'tableSyncCopyTableIds'],
  })
  const hasPublication = !!publicationName && publication?.name === publicationName

  const tableSyncCopy = getTableSyncCopy({ mode, selectedTableIds: ids })

  const isEstimateEnabled = enabled && hasPublication && tableSyncCopy !== undefined
  const { data, isLoading, failureCount, errorUpdateCount } = useReplicationCostEstimateQuery(
    { projectRef, sourceId, publicationName },
    { enabled: isEstimateEnabled }
  )
  const isInitialCostEstimateLoading =
    isEstimateEnabled && isLoading && failureCount === 0 && errorUpdateCount === 0

  if (!hasPublication) return { status: 'missing-publication', isInitialCostEstimateLoading: false }
  if (tableSyncCopy === undefined)
    return { status: 'missing-selection', isInitialCostEstimateLoading: false }

  return {
    status: 'estimate',
    isInitialCostEstimateLoading,
    estimate: data,
    publicationTables: publication.tables,
    tableSyncCopy,
  }
}

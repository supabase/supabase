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
      isError: boolean
      publicationTables: ReplicationPublicationData['tables']
      tableSyncCopy: TableSyncCopyConfig
    }
)

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

  let tableSyncCopy: TableSyncCopyConfig | undefined
  try {
    tableSyncCopy = buildTableSyncCopyConfig({ mode, selectedTableIds: ids })
  } catch {
    // An incomplete initial sync selection has no estimate to request.
  }

  const isEstimateEnabled = enabled && hasPublication && tableSyncCopy !== undefined
  const { data, isLoading, isError } = useReplicationCostEstimateQuery(
    { projectRef, sourceId, publicationName },
    { enabled: isEstimateEnabled }
  )
  const isInitialCostEstimateLoading = isEstimateEnabled && isLoading

  if (!hasPublication) return { status: 'missing-publication', isInitialCostEstimateLoading: false }
  if (tableSyncCopy === undefined)
    return { status: 'missing-selection', isInitialCostEstimateLoading: false }

  return {
    status: 'estimate',
    isInitialCostEstimateLoading,
    estimate: data,
    isError,
    publicationTables: publication.tables,
    tableSyncCopy,
  }
}

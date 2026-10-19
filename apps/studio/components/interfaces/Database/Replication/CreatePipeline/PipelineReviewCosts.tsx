import { useParams } from 'common'
import { useWatch, type Control } from 'react-hook-form'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { buildTableSyncCopyConfig } from '../DestinationPanel/DestinationForm/DestinationForm.utils'
import { PipelineCostEstimate } from './PipelineCostEstimate'
import { useReplicationCostEstimateQuery } from '@/data/replication/cost-estimate-query'
import type { ReplicationPublicationData } from '@/data/replication/publication-query'
import { useReplicationSourceId } from '@/data/replication/sources-query'

export const PipelineReviewCosts = ({
  control,
  publication,
}: {
  control: Control<DestinationPanelSchemaType>
  publication?: ReplicationPublicationData
}) => {
  const { ref: projectRef } = useParams()
  const sourceId = useReplicationSourceId({ projectRef })
  const [publicationName, mode, ids] = useWatch({
    control,
    name: ['publicationName', 'tableSyncCopyMode', 'tableSyncCopyTableIds'],
  })
  const hasPublication = !!publicationName && publication?.name === publicationName
  const { data, isLoading, isError } = useReplicationCostEstimateQuery(
    { projectRef, sourceId, publicationName },
    { enabled: hasPublication }
  )
  if (!hasPublication)
    return (
      <div className="p-5 text-sm text-foreground-light">
        Select an available publication to estimate costs.
      </div>
    )
  let tableSyncCopy
  try {
    tableSyncCopy = buildTableSyncCopyConfig({ mode, selectedTableIds: ids })
  } catch {
    return (
      <div className="p-5 text-sm text-foreground-light">
        Complete the initial sync selection to estimate costs.
      </div>
    )
  }
  return (
    <PipelineCostEstimate
      estimate={data}
      isLoading={isLoading}
      isError={isError}
      publicationTables={publication.tables}
      tableSyncCopy={tableSyncCopy}
    />
  )
}

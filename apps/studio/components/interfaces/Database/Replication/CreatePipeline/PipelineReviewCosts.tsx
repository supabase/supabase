import type { Control } from 'react-hook-form'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { PipelineCostEstimate } from './PipelineCostEstimate'
import { usePipelineReviewCosts } from './usePipelineReviewCosts'
import type { ReplicationPublicationData } from '@/data/replication/publication-query'

export const PipelineReviewCosts = ({
  control,
  publication,
}: {
  control: Control<DestinationPanelSchemaType>
  publication?: ReplicationPublicationData
}) => {
  const costs = usePipelineReviewCosts({ control, publication })
  if (costs.status === 'missing-publication')
    return (
      <div className="p-5 text-sm text-foreground-light">
        Select an available publication to estimate costs.
      </div>
    )
  if (costs.status === 'missing-selection')
    return (
      <div className="p-5 text-sm text-foreground-light">
        Complete the initial sync selection to estimate costs.
      </div>
    )
  return (
    <PipelineCostEstimate
      estimate={costs.estimate}
      isLoading={costs.isInitialCostEstimateLoading}
      publicationTables={costs.publicationTables}
      tableSyncCopy={costs.tableSyncCopy}
    />
  )
}

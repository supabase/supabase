import { PipelineCostEstimate } from './PipelineCostEstimate'
import type { usePipelineReviewCosts } from './usePipelineReviewCosts'

export const PipelineReviewCosts = ({
  costs,
}: {
  costs: ReturnType<typeof usePipelineReviewCosts>
}) => {
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

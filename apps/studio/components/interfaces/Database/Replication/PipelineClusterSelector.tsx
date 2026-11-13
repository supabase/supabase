import { useQuery } from '@tanstack/react-query'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useRef } from 'react'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { PipelineRegionSelect } from './DestinationPanel/DestinationForm/PipelineRegionField'
import { usePreferredPipelineClusterId } from './usePreferredPipelineClusterId'
import { replicationClustersQueryOptions } from '@/data/replication/clusters-query'
import { useReplicationClusterId } from '@/state/replication-cluster'

/** Picks the region a new pipeline is created in. Hidden when there is only one region. */
export const PipelineClusterSelector = ({ onChange }: { onChange?: () => void }) => {
  const [urlClusterId, setClusterId] = useQueryState(
    'cluster_id',
    parseAsString.withOptions({ history: 'replace' })
  )
  const { data } = useQuery(replicationClustersQueryOptions())
  const clusterId = useReplicationClusterId()
  const preferredCluster = usePreferredPipelineClusterId()

  // Starts in the project's region once, without overriding a deep link or a later choice.
  const appliedPreferenceRef = useRef(false)
  useEffect(() => {
    if (appliedPreferenceRef.current || !preferredCluster.isReady) return
    appliedPreferenceRef.current = true
    if (urlClusterId === null && preferredCluster.clusterId !== undefined) {
      void setClusterId(preferredCluster.clusterId)
    }
  }, [preferredCluster.isReady, preferredCluster.clusterId, urlClusterId, setClusterId])

  if (!data || data.regions.length <= 1) return null

  return (
    <FormItemLayout
      isReactForm={false}
      layout="horizontal"
      label="Pipeline region"
      description="The pipeline runs from this region. Destination connections originate here."
    >
      <PipelineRegionSelect
        value={clusterId ?? data.default_cluster_id}
        onValueChange={(value) => {
          void setClusterId(value === data.default_cluster_id ? null : value)
          onChange?.()
        }}
      />
    </FormItemLayout>
  )
}

import { useQuery } from '@tanstack/react-query'
import { AWS_REGIONS } from 'shared-data'
import { cn, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationType } from '../DestinationPanel.types'
import { RegionFlag } from '@/components/ui/RegionFlag'
import {
  getReplicationRegionLabel,
  replicationClustersQueryOptions,
  toRequestClusterId,
  useReplicationClusterGroups,
} from '@/data/replication/clusters-query'
import { IS_STAGING_OR_LOCAL } from '@/lib/constants'
import { useReplicationClusterId } from '@/state/replication-cluster'

export const PIPELINE_REGION = IS_STAGING_OR_LOCAL
  ? AWS_REGIONS.SOUTHEAST_ASIA
  : AWS_REGIONS.CENTRAL_EU

const DESTINATION_REGION_HINT: Record<DestinationType, string> = {
  BigQuery: 'Choose a nearby BigQuery dataset where possible.',
  'Analytics Bucket': 'Keep this bucket in the same region where possible.',
  DuckLake: 'Keep catalog and object storage close to this region where possible.',
  Snowflake: 'Choose a nearby Snowflake account region where possible.',
  ClickHouse: 'Choose a nearby ClickHouse cluster where possible.',
}

export const getPipelineRegionDescription = (
  destinationType?: DestinationType,
  hasMultipleRegions = false
) => {
  const destinationHint = destinationType
    ? DESTINATION_REGION_HINT[destinationType]
    : 'Choose a nearby destination region where possible.'
  const regionNote = hasMultipleRegions
    ? 'This pipeline runs from this region.'
    : 'All pipelines run from this region.'

  return `${regionNote} ${destinationHint}`
}

export const PipelineRegionField = ({
  destinationType,
  className,
  onRegionChange,
}: {
  destinationType?: DestinationType
  className?: string
  /** Makes the region selectable when there is more than one region. */
  onRegionChange?: (clusterId: string | undefined) => void
}) => {
  const { hasMultipleRegions } = useReplicationClusterGroups()
  const { data } = useQuery(replicationClustersQueryOptions())
  const clusterId = useReplicationClusterId()
  const canSelectRegion = hasMultipleRegions && onRegionChange !== undefined && data !== undefined

  return (
    <FormItemLayout
      isReactForm={false}
      layout="horizontal"
      label="Pipeline region"
      description={getPipelineRegionDescription(destinationType, hasMultipleRegions)}
    >
      {canSelectRegion ? (
        <PipelineRegionSelect
          className={className}
          value={clusterId ?? data.default_cluster_id}
          onValueChange={(value) =>
            onRegionChange(toRequestClusterId(value, data.default_cluster_id))
          }
        />
      ) : (
        <PipelineRegionReadonly className={className} />
      )}
    </FormItemLayout>
  )
}

export const PipelineRegionSelect = ({
  value,
  onValueChange,
  className,
}: {
  value: string
  onValueChange: (clusterId: string) => void
  className?: string
}) => {
  const { data } = useQuery(replicationClustersQueryOptions())

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label="Pipeline region" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {data?.regions.map((region) => (
          <SelectItem key={region.cluster_id} value={region.cluster_id}>
            {getReplicationRegionLabel(region)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export const PipelineRegionReadonly = ({ className }: { className?: string }) => {
  const selectedClusterId = useReplicationClusterId()
  const { data } = useQuery(replicationClustersQueryOptions())
  const clusterId = selectedClusterId ?? data?.default_cluster_id
  const cluster = data?.regions.find((item) => item.cluster_id === clusterId)
  // Local development reports no region code; keep showing the fixed pipeline region there.
  const region = cluster?.region_code ? cluster : undefined

  return (
    <div
      className={cn(
        'flex h-9 min-w-0 items-center gap-x-2 rounded-md border bg-surface-200 px-3 text-sm',
        className
      )}
    >
      <RegionFlag className="w-5 shrink-0" region={region?.region_code ?? PIPELINE_REGION.code} />
      <span className="min-w-0 truncate text-foreground">
        {region?.region_name ?? PIPELINE_REGION.displayName}
      </span>
      <span className="shrink-0 font-mono text-xs text-foreground-lighter">
        {region?.region_code ?? PIPELINE_REGION.code}
      </span>
    </div>
  )
}

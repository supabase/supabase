import { useQuery } from '@tanstack/react-query'
import { AWS_REGIONS } from 'shared-data'
import { cn, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationType } from '../DestinationPanel.types'
import { toRequestClusterId } from '@/components/interfaces/Database/Replication/PipelineClusterScope.utils'
import { RegionFlag } from '@/components/ui/RegionFlag'
import {
  replicationClustersQueryOptions,
  type ReplicationRegion,
} from '@/data/replication/clusters-query'
import { IS_STAGING_OR_LOCAL } from '@/lib/constants'

export const PIPELINE_REGION = IS_STAGING_OR_LOCAL
  ? AWS_REGIONS.SOUTHEAST_ASIA
  : AWS_REGIONS.CENTRAL_EU

const DESTINATION_REGION_HINT: Record<DestinationType, string> = {
  BigQuery: 'Choose a nearby BigQuery dataset where possible.',
  DuckLake: 'Keep catalog and object storage close to this region where possible.',
  Snowflake: 'Choose a nearby Snowflake account region where possible.',
  ClickHouse: 'Choose a nearby ClickHouse cluster where possible.',
}

export const getPipelineRegionDescription = (destinationType?: DestinationType) =>
  destinationType
    ? DESTINATION_REGION_HINT[destinationType]
    : 'Choose a nearby destination region where possible.'

export const PipelineRegionField = ({
  destinationType,
  clusterId,
  className,
  onRegionChange,
  preferredClusterId,
  disabled,
}: {
  destinationType?: DestinationType
  clusterId?: string
  className?: string
  /** Makes the region selectable when there is more than one region. */
  onRegionChange?: (clusterId: string | undefined) => void
  preferredClusterId?: string
  disabled?: boolean
}) => {
  const { data } = useQuery(replicationClustersQueryOptions())
  const hasMultipleRegions = (data?.regions.length ?? 0) > 1
  const canSelectRegion = hasMultipleRegions && onRegionChange !== undefined && data !== undefined
  const regions = data?.regions ?? []
  const firstRegion = regions.find(
    (region) => region.cluster_id === (preferredClusterId ?? data?.default_cluster_id)
  )
  const orderedRegions = firstRegion
    ? [firstRegion, ...regions.filter((region) => region.cluster_id !== firstRegion.cluster_id)]
    : regions

  return (
    <FormItemLayout
      isReactForm={false}
      layout="horizontal"
      label="Pipeline region"
      description={getPipelineRegionDescription(destinationType)}
    >
      {canSelectRegion ? (
        <PipelineRegionSelect
          regions={orderedRegions}
          className={className}
          disabled={disabled}
          value={clusterId ?? data.default_cluster_id}
          onValueChange={(value) =>
            onRegionChange(toRequestClusterId(value, data.default_cluster_id))
          }
        />
      ) : (
        <PipelineRegionReadonly clusterId={clusterId} className={className} />
      )}
    </FormItemLayout>
  )
}

const PipelineRegionSelect = ({
  regions,
  value,
  onValueChange,
  className,
  disabled,
}: {
  regions: ReplicationRegion[]
  value: string
  onValueChange: (clusterId: string) => void
  className?: string
  disabled?: boolean
}) => (
  <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger aria-label="Pipeline region" className={className}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {regions.map((region) => {
        const label = region.region_code
          ? `${region.region_name} (${region.region_code})`
          : region.region_name
        return (
          <SelectItem key={region.cluster_id} value={region.cluster_id} textValue={label}>
            <span className="flex items-center gap-x-2">
              {region.region_code && (
                <RegionFlag className="w-5 shrink-0" region={region.region_code} />
              )}
              <span>
                {region.region_name}
                {region.region_code && (
                  <span className="text-foreground-lighter"> ({region.region_code})</span>
                )}
              </span>
            </span>
          </SelectItem>
        )
      })}
    </SelectContent>
  </Select>
)

export const PipelineRegionReadonly = ({
  clusterId: selectedClusterId,
  className,
}: {
  clusterId?: string
  className?: string
}) => {
  const { data } = useQuery(replicationClustersQueryOptions())
  const clusterId = selectedClusterId ?? data?.default_cluster_id
  const cluster = data?.regions.find((item) => item.cluster_id === clusterId)
  const regionCode = cluster ? cluster.region_code : PIPELINE_REGION.code

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'flex h-9 min-w-0 items-center gap-x-2 rounded-md border bg-surface-200 px-3 text-sm',
        className
      )}
    >
      {regionCode && <RegionFlag className="w-5 shrink-0" region={regionCode} />}
      <span className="min-w-0 truncate text-foreground">
        {cluster?.region_name ?? PIPELINE_REGION.displayName}
      </span>
      {regionCode && (
        <span className="shrink-0 font-mono text-xs text-foreground-lighter">{regionCode}</span>
      )}
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { AWS_REGIONS } from 'shared-data'
import { cn } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationType } from '../DestinationPanel.types'
import { RegionFlag } from '@/components/ui/RegionFlag'
import { replicationClustersQueryOptions } from '@/data/replication/clusters-query'
import { IS_STAGING_OR_LOCAL } from '@/lib/constants'

// Keep the existing environment region as a fallback when discovery has no region code.
export const PIPELINE_REGION = IS_STAGING_OR_LOCAL
  ? AWS_REGIONS.SOUTHEAST_ASIA
  : AWS_REGIONS.CENTRAL_EU

const DESTINATION_REGION_HINT: Record<DestinationType, string> = {
  BigQuery: 'Choose a nearby BigQuery dataset where possible.',
  DuckLake: 'Keep catalog and object storage close to this region where possible.',
  Snowflake: 'Choose a nearby Snowflake account region where possible.',
  ClickHouse: 'Choose a nearby ClickHouse cluster where possible.',
}

export const getPipelineRegionDescription = (destinationType?: DestinationType) => {
  const destinationHint = destinationType
    ? DESTINATION_REGION_HINT[destinationType]
    : 'Choose a nearby destination region where possible.'

  return `All pipelines run from this region. ${destinationHint}`
}

export const PipelineRegionField = ({
  destinationType,
  clusterId: selectedClusterId,
  className,
}: {
  destinationType?: DestinationType
  clusterId?: string
  className?: string
}) => {
  return (
    <FormItemLayout
      isReactForm={false}
      layout="horizontal"
      label="Pipeline region"
      description={getPipelineRegionDescription(destinationType)}
    >
      <PipelineRegionReadonly clusterId={selectedClusterId} className={className} />
    </FormItemLayout>
  )
}

export const PipelineRegionReadonly = ({
  clusterId: selectedClusterId,
  className,
}: {
  clusterId?: string
  className?: string
}) => {
  const { data } = useQuery(replicationClustersQueryOptions())
  const clusterId = selectedClusterId ?? data?.default_cluster_id
  const cluster = data?.regions.find((region) => region.cluster_id === clusterId)
  const region = cluster?.region_code ? cluster : undefined
  const regionCode = region?.region_code ?? PIPELINE_REGION.code

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'flex h-9 min-w-0 items-center gap-x-2 rounded-md border bg-surface-200 px-3 text-sm',
        className
      )}
    >
      <RegionFlag className="w-5 shrink-0" region={regionCode} />
      <span className="min-w-0 truncate text-foreground">
        {region?.region_name ?? PIPELINE_REGION.displayName}
      </span>
      <span className="shrink-0 font-mono text-xs text-foreground-lighter">{regionCode}</span>
    </div>
  )
}

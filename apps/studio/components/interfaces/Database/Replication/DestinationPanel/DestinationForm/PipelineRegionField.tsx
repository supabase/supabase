import { cn } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { PIPELINE_REGION } from '../../Replication.constants'
import type { DestinationType } from '../DestinationPanel.types'
import { RegionFlag } from '@/components/ui/RegionFlag'

const DESTINATION_REGION_HINT: Record<DestinationType, string> = {
  BigQuery: 'Choose a nearby BigQuery dataset where possible.',
  'Analytics Bucket': 'Keep this bucket in the same region where possible.',
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
  className,
}: {
  destinationType?: DestinationType
  className?: string
}) => {
  return (
    <FormItemLayout
      isReactForm={false}
      layout="horizontal"
      label="Pipeline region"
      description={getPipelineRegionDescription(destinationType)}
    >
      <div
        className={cn(
          'flex h-9 min-w-0 items-center gap-x-2 rounded-md border bg-surface-200 px-3 text-sm',
          className
        )}
      >
        <RegionFlag className="w-5 shrink-0" region={PIPELINE_REGION.code} />
        <span className="min-w-0 truncate text-foreground">{PIPELINE_REGION.displayName}</span>
        <span className="shrink-0 font-mono text-xs text-foreground-lighter">
          {PIPELINE_REGION.code}
        </span>
      </div>
    </FormItemLayout>
  )
}

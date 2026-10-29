import type { Control } from 'react-hook-form'
import { AWS_REGIONS } from 'shared-data'
import {
  cn,
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { DestinationType } from '../DestinationPanel.types'
import type { DestinationPanelSchemaType } from './DestinationForm.schema'
import { RegionFlag } from '@/components/ui/RegionFlag'
import { IS_STAGING_OR_LOCAL } from '@/lib/constants'

// UI prototype only. These choices do not change backend pipeline placement.
export const PIPELINE_REGION = IS_STAGING_OR_LOCAL
  ? AWS_REGIONS.SOUTHEAST_ASIA
  : AWS_REGIONS.CENTRAL_EU

export const PIPELINE_REGION_OPTIONS = [
  AWS_REGIONS.EAST_US,
  AWS_REGIONS.CENTRAL_EU,
  AWS_REGIONS.SOUTHEAST_ASIA,
]

export const getPipelineRegion = (code?: string) =>
  PIPELINE_REGION_OPTIONS.find((region) => region.code === code) ?? PIPELINE_REGION

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

  return destinationHint
}

export const PipelineRegionField = ({
  destinationType,
  className,
  control,
}: {
  destinationType?: DestinationType
  control?: Control<DestinationPanelSchemaType>
  className?: string
}) => {
  if (control)
    return (
      <FormField
        control={control}
        name="pipelineRegion"
        render={({ field }) => (
          <FormItemLayout
            layout="horizontal"
            label="Pipeline region"
            description={getPipelineRegionDescription(destinationType)}
          >
            <Select value={getPipelineRegion(field.value).code} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className={className}>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PIPELINE_REGION_OPTIONS.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    <span className="flex items-center gap-2">
                      <RegionFlag className="w-5" region={region.code} />
                      {region.displayName}
                      <span className="text-foreground-lighter">{region.code}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItemLayout>
        )}
      />
    )

  return (
    <FormItemLayout
      isReactForm={false}
      layout="horizontal"
      label="Pipeline region"
      description={getPipelineRegionDescription(destinationType)}
    >
      <PipelineRegionReadonly className={className} />
    </FormItemLayout>
  )
}

export const PipelineRegionReadonly = ({
  className,
  regionCode,
}: {
  className?: string
  regionCode?: string
}) => {
  const region = getPipelineRegion(regionCode)
  return (
    <div
      className={cn(
        'flex h-9 min-w-0 items-center gap-x-2 rounded-md border bg-surface-200 px-3 text-sm',
        className
      )}
    >
      <RegionFlag className="w-5 shrink-0" region={region.code} />
      <span className="min-w-0 truncate text-foreground">{region.displayName}</span>
      <span className="shrink-0 font-mono text-xs text-foreground-lighter">{region.code}</span>
    </div>
  )
}

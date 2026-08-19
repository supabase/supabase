import { AWS_REGIONS } from 'shared-data'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { BASE_PATH, IS_STAGING_OR_LOCAL } from '@/lib/constants'

const PIPELINE_REGION = IS_STAGING_OR_LOCAL ? AWS_REGIONS.SOUTHEAST_ASIA : AWS_REGIONS.CENTRAL_EU

export const PipelineRegionField = () => {
  return (
    <FormItemLayout
      isReactForm={false}
      layout="horizontal"
      label="Region"
      description={
        <span className="text-foreground-lighter">
          Pipelines run in{' '}
          <Tooltip>
            <TooltipTrigger className={InlineLinkClassName}>
              {PIPELINE_REGION.displayName}
            </TooltipTrigger>
            <TooltipContent side="bottom">{PIPELINE_REGION.code}</TooltipContent>
          </Tooltip>
          . In your destination provider, choose the closest available region.
        </span>
      }
    >
      <Select disabled value={PIPELINE_REGION.code}>
        <SelectTrigger>
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PIPELINE_REGION.code}>
            <div className="flex items-center gap-x-3">
              <img
                alt="region icon"
                className="w-5 rounded-xs"
                src={`${BASE_PATH}/img/regions/${PIPELINE_REGION.code}.svg`}
              />
              <p className="flex items-center gap-x-2">
                <span>{PIPELINE_REGION.displayName}</span>
                <span className="font-mono text-xs text-foreground-lighter">
                  {PIPELINE_REGION.code}
                </span>
              </p>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </FormItemLayout>
  )
}

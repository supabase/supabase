'use client'

import { cn, Switch } from 'ui'
import { Label } from 'ui/src/components/shadcn/ui/label'

import { InfoTooltip } from '../../info-tooltip'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '../../multi-select'
import type { McpFeatureGroup } from '../types'

interface McpConfigurationOptionsProps {
  isPlatform: boolean
  readonly: boolean
  onReadonlyChange: (readonly: boolean) => void
  selectedFeatures: string[]
  onFeaturesChange: (features: string[]) => void
  featureGroups: McpFeatureGroup[]
  className?: string
}

export function McpConfigurationOptions({
  isPlatform,
  readonly,
  onReadonlyChange,
  selectedFeatures,
  onFeaturesChange,
  featureGroups,
  className,
}: McpConfigurationOptionsProps) {
  return (
    <div className={cn('flex flex-col gap-4 lg:flex-row lg:gap-12 lg:items-baseline', className)}>
      {/* Readonly Mode */}
      <div className="space-y-3 lg:flex-shrink-0">
        <div className="flex items-center gap-2">
          <Label htmlFor="readonly" className="text-sm">
            Read-only
          </Label>
          <InfoTooltip>Only allow read operations on your database</InfoTooltip>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="readonly" checked={readonly} onCheckedChange={onReadonlyChange} />
        </div>
      </div>

      {/* Feature Groups */}
      <div className="space-y-3 lg:flex-1">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Feature Groups</Label>
          <InfoTooltip>
            Only enable a subset of features. Helps keep the number of tools within MCP client
            limits
          </InfoTooltip>
        </div>

        <MultiSelector values={selectedFeatures} onValuesChange={onFeaturesChange}>
          <MultiSelectorTrigger
            className="w-full"
            label="All features except Storage enabled by default"
            badgeLimit="wrap"
            showIcon={true}
          />
          <MultiSelectorContent>
            <MultiSelectorList>
              {featureGroups.map((feature) => (
                <MultiSelectorItem key={feature.id} value={feature.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{feature.name}</span>
                    <span className="text-xs text-foreground-light">{feature.description}</span>
                  </div>
                </MultiSelectorItem>
              ))}
            </MultiSelectorList>
          </MultiSelectorContent>
        </MultiSelector>
      </div>
    </div>
  )
}

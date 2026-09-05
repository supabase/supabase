import { type ReactNode } from 'react'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import { DetailSubtext } from '../DetailSubtext'

interface PipelineDetailItemProps {
  label: string
  /** A fixed explanation of what this field is. Never the current value's meaning. */
  tooltip?: ReactNode
  /** Explains what the current value means, when the value alone isn't enough. */
  description?: ReactNode
  children: ReactNode
}

/**
 * One label and value inside a pipeline detail card. Shared so the configuration and health
 * cards read as the same grid rather than two different treatments of the same idea.
 */
export const PipelineDetailItem = ({
  label,
  tooltip,
  description,
  children,
}: PipelineDetailItemProps) => (
  <div className="space-y-1">
    <dt className="flex items-center gap-1.5 text-sm text-foreground-lighter">
      {label}
      {tooltip !== undefined && (
        <InfoTooltip side="top" className="max-w-56">
          {tooltip}
        </InfoTooltip>
      )}
    </dt>
    <dd className="text-sm">{children}</dd>
    {description !== undefined && <DetailSubtext>{description}</DetailSubtext>}
  </div>
)

export const PIPELINE_DETAIL_GRID_CLASS_NAME = 'grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2'

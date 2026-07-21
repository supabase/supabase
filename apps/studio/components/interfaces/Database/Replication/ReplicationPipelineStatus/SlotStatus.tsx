import { Info } from 'lucide-react'
import {
  Badge,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { SlotWalStatus } from './ReplicationPipelineStatus.types'
import { getWalStatusMeta, WAL_STATUS_LEGEND } from './ReplicationPipelineStatus.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

export type SlotStatusContext = 'pipeline' | 'table'

const CONNECTION_TEXT: Record<SlotStatusContext, { active: string; inactive: string }> = {
  pipeline: {
    active: "This pipeline's replication slot is active and being used right now.",
    inactive: "This pipeline's replication slot is not active right now.",
  },
  table: {
    active: "This table's replication slot is active and being used right now.",
    inactive: "This table's replication slot is not active right now.",
  },
}

/**
 * Colored badge for a slot's WAL status, with the plain-language meaning on hover.
 * Pass `context="table"` in the per-table inline view to show table-specific descriptions.
 */
export const SlotStatusBadge = ({
  status,
  context = 'pipeline',
}: {
  status?: SlotWalStatus
  context?: SlotStatusContext
}) => {
  const meta = getWalStatusMeta(status)
  const description = context === 'table' ? meta.tableDescription : meta.description
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={meta.variant} className="cursor-default">
          {meta.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px]">
        {description}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Info button opening a legend that explains every possible slot status.
 */
export const SlotStatusLegend = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          tabIndex={0}
          aria-label="What do the slot statuses mean?"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-surface-200 text-foreground-lighter transition-colors hover:bg-surface-300 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-foreground-lighter"
        >
          <Info size={12} />
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="center" className="w-[26rem] p-0">
        <div className="px-4 py-3 border-b border-overlay">
          <p className="text-sm text-foreground">Slot statuses</p>
          <p className="text-xs text-foreground-light">
            How safely your database is keeping the changes the pipeline still needs.
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-overlay">
          {WAL_STATUS_LEGEND.map((meta) => (
            <li key={meta.label} className="flex items-start gap-x-3 px-4 py-2.5">
              <div className="flex h-5 w-28 shrink-0 items-center">
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
              <span className="flex-1 text-xs leading-5 text-foreground-light">
                {meta.description}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-overlay px-4 py-2.5">
          <InlineLink
            href={`${DOCS_URL}/guides/database/replication/pipelines-monitoring`}
            className="text-xs text-foreground-light"
          >
            Learn more about monitoring replication
          </InlineLink>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Small dot + label indicating whether the slot has a live replication connection.
 * Pass `context="table"` in the per-table inline view to show table-specific descriptions.
 */
export const SlotConnectionIndicator = ({
  isActive,
  context = 'pipeline',
}: {
  isActive?: boolean
  context?: SlotStatusContext
}) => {
  const text = CONNECTION_TEXT[context]
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-x-1.5 text-xs text-foreground-light cursor-default">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full shrink-0',
              isActive ? 'bg-brand' : 'bg-foreground-muted'
            )}
          />
          {isActive ? 'Connected' : 'Not connected'}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px]">
        {isActive ? text.active : text.inactive}
      </TooltipContent>
    </Tooltip>
  )
}

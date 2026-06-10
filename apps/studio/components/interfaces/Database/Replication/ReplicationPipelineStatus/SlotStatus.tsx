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

/**
 * Colored badge for a slot's WAL status, with the plain-language meaning on hover.
 */
export const SlotStatusBadge = ({ status }: { status?: SlotWalStatus }) => {
  const meta = getWalStatusMeta(status)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={meta.variant} className="cursor-help">
          {meta.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px]">
        {meta.description}
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
            href={`${DOCS_URL}/guides/database/replication/external-replication-monitoring`}
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
 */
export const SlotConnectionIndicator = ({ isActive }: { isActive?: boolean }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-x-1.5 text-xs text-foreground-light cursor-help">
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
        {isActive
          ? 'The pipeline is connected to your database and reading changes right now.'
          : "The pipeline isn't connected to your database right now."}
      </TooltipContent>
    </Tooltip>
  )
}

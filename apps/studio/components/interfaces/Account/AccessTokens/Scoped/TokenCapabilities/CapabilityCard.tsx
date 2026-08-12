import { AccordionContent, AccordionItem, AccordionTrigger, Badge, cn } from 'ui'

import { PERMISSION_MODE_LABEL } from '../../AccessToken.permissions'
import type { EntryAccess } from '../../AccessToken.roles'
import type { CapabilitySummaryEntry } from '../../hooks/useCapabilitySummary'
import { ExceedsRoleBadge } from '../ExceedsRoleBadge'
import { CapabilityCardBody } from './CapabilityCardBody'
import { pluralize } from '@/lib/helpers'

interface CapabilityCardProps {
  capability: CapabilitySummaryEntry
  /** Accordion tiers wrap the header in a trigger button; the ≤2 tier renders it inert. */
  collapsible: boolean
  accessEntries: Record<string, EntryAccess>
  /** Position within the continuous bordered list — controls corner rounding and shared edges. */
  isFirst?: boolean
  isLast?: boolean
}

const CapabilityCardHeader = ({
  capability,
  accessEntries,
}: Pick<CapabilityCardProps, 'capability' | 'accessEntries'>) => {
  const { entry, mode, endpoints, mcpTools } = capability
  const entryAccess = accessEntries[entry.key]

  return (
    <div className="flex flex-1 items-center justify-between gap-2 pr-2">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{entry.name}</span>
          {entryAccess?.status === 'exceeds-role' && (
            <ExceedsRoleBadge entry={entry} mode={mode} access={entryAccess} />
          )}
        </span>
        <span className="text-xs text-foreground-lighter">
          {endpoints.length} {pluralize(endpoints.length, 'endpoint')} and {mcpTools.length} MCP{' '}
          {pluralize(mcpTools.length, 'tool')}
        </span>
      </div>
      <Badge variant={mode === 'readwrite' ? 'warning' : 'default'} className="shrink-0">
        {PERMISSION_MODE_LABEL[mode]}
      </Badge>
    </div>
  )
}

export const CapabilityCard = ({
  capability,
  collapsible,
  accessEntries,
  isFirst = true,
  isLast = true,
}: CapabilityCardProps) => {
  const body = (
    <CapabilityCardBody endpoints={capability.endpoints} mcpTools={capability.mcpTools} />
  )
  const positionClassName = cn(
    'border',
    !isLast && 'border-b-0',
    isFirst && 'rounded-t-md',
    isLast && 'rounded-b-md'
  )

  if (!collapsible) {
    return (
      <div className={positionClassName}>
        <div className="bg-surface-300 px-4 py-3">
          <CapabilityCardHeader capability={capability} accessEntries={accessEntries} />
        </div>
        <div className="px-4 pb-4">{body}</div>
      </div>
    )
  }

  return (
    <AccordionItem value={capability.entry.key} className={positionClassName}>
      <AccordionTrigger className="bg-surface-300 px-4 py-3 transition first:rounded-t last:rounded-b hover:no-underline">
        <CapabilityCardHeader capability={capability} accessEntries={accessEntries} />
      </AccordionTrigger>
      <AccordionContent className="*:pb-0">
        <div className="px-4 pb-4">{body}</div>
      </AccordionContent>
    </AccordionItem>
  )
}

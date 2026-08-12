import { AccordionContent, AccordionItem, AccordionTrigger, Badge } from 'ui'

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
}

const CapabilityCardHeader = ({
  capability,
  accessEntries,
}: Pick<CapabilityCardProps, 'capability' | 'accessEntries'>) => {
  const { entry, mode, endpoints, mcpTools } = capability
  const entryAccess = accessEntries[entry.key]

  return (
    <div className="flex w-full flex-1 items-center justify-between gap-2">
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground">{entry.name}</span>
        <Badge variant={mode === 'readwrite' ? 'warning' : 'default'}>
          {PERMISSION_MODE_LABEL[mode]}
        </Badge>
        {entryAccess?.status === 'exceeds-role' && (
          <ExceedsRoleBadge entry={entry} mode={mode} access={entryAccess} />
        )}
      </span>
      <span className="shrink-0 text-xs text-foreground-lighter">
        {endpoints.length} {pluralize(endpoints.length, 'endpoint')}
        {mcpTools.length > 0 && ` · ${mcpTools.length} ${pluralize(mcpTools.length, 'tool')}`}
      </span>
    </div>
  )
}

export const CapabilityCard = ({ capability, collapsible, accessEntries }: CapabilityCardProps) => {
  const body = (
    <CapabilityCardBody endpoints={capability.endpoints} mcpTools={capability.mcpTools} />
  )

  if (!collapsible) {
    return (
      <div className="rounded-md border">
        <div className="px-3 py-2">
          <CapabilityCardHeader capability={capability} accessEntries={accessEntries} />
        </div>
        <div className="border-t p-3">{body}</div>
      </div>
    )
  }

  return (
    <AccordionItem value={capability.entry.key} className="rounded-md border">
      <AccordionTrigger className="px-3 py-2 font-normal hover:no-underline">
        <CapabilityCardHeader capability={capability} accessEntries={accessEntries} />
      </AccordionTrigger>
      <AccordionContent className="border-t">
        <div className="p-3">{body}</div>
      </AccordionContent>
    </AccordionItem>
  )
}

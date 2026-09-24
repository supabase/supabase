import dayjs from 'dayjs'
import { Activity, ChevronDown, Clock, Copy, Globe, Hash, User } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  copyToClipboard,
} from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { getStatusLevel } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { DetailSectionHeader } from '@/components/ui/DataTable/DetailSectionHeader'
import {
  TIMESTAMP_MICROS_PER_MS,
  type AuditLog,
} from '@/data/organizations/organization-audit-logs-query'

interface AuditLogOverviewProps {
  selectedLog: AuditLog
}

type IconComponent = typeof Clock

const DetailRow = ({
  label,
  value,
}: {
  label: string
  value: string | number | undefined | null
}) => {
  const isEmpty = value === null || value === undefined || value === ''

  return (
    <div className="flex h-9 items-center justify-between gap-x-10 px-4 pl-[38px]">
      <span className="shrink-0 text-xs uppercase tracking-wide text-foreground-lighter font-mono">
        {label}
      </span>
      <div
        className={cn('flex items-center gap-x-2 min-w-0 flex-1 justify-end', isEmpty && 'pr-2')}
      >
        {isEmpty ? (
          <span className="font-mono text-xs text-foreground-muted">—</span>
        ) : (
          <span className="truncate font-mono text-xs text-foreground text-right">{value}</span>
        )}
        {!isEmpty && (
          <Button
            aria-label={`Copy ${label}`}
            variant="text"
            className="px-1"
            icon={<Copy size={12} />}
            onClick={() => copyToClipboard(String(value))}
          />
        )}
      </div>
    </div>
  )
}

const DetailSection = ({
  title,
  icon,
  children,
}: {
  title: string
  icon: IconComponent
  children: ReactNode
}) => (
  <Collapsible defaultOpen>
    <CollapsibleTrigger className="w-full flex items-center justify-between pr-4 [&[data-state=open]>svg]:-rotate-180! transition hover:bg-surface-100">
      <DetailSectionHeader title={title} icon={icon} />
      <ChevronDown className="transition-transform duration-200" strokeWidth={1.5} size={14} />
    </CollapsibleTrigger>
    <CollapsibleContent className="[&>*:nth-child(odd)]:bg-surface-100/50">
      {children}
    </CollapsibleContent>
  </Collapsible>
)

export const AuditLogOverview = ({ selectedLog }: AuditLogOverviewProps) => {
  const hasMetadata = Object.keys(selectedLog.action.metadata ?? {}).length > 0

  return (
    <div>
      <DetailSectionHeader
        title="Request started"
        icon={Clock}
        summary={
          <TimestampInfo
            className="text-xs font-mono"
            utcTimestamp={dayjs(selectedLog.timestamp / TIMESTAMP_MICROS_PER_MS).toISOString()}
          />
        }
      />
      <DetailSectionHeader
        title="Request ID"
        icon={Hash}
        summary={
          <span className="truncate text-right font-mono text-xs text-foreground">
            {selectedLog.request_id}
          </span>
        }
      />

      <DetailSection title="Target" icon={Globe}>
        <DetailRow label="Organization slug" value={selectedLog.organization_slug} />
        <DetailRow label="Project ref" value={selectedLog.project_ref} />
      </DetailSection>

      <DetailSection title="Actor" icon={User}>
        <DetailRow label="Token type" value={selectedLog.actor.token_type} />
        <DetailRow label="Email" value={selectedLog.actor.email} />
        <DetailRow label="User ID" value={selectedLog.actor.user_id} />
        <DetailRow label="IP address" value={selectedLog.actor.ip} />
      </DetailSection>

      <DetailSection title="Action" icon={Activity}>
        <DetailRow label="Name" value={selectedLog.action.name} />
        <DetailRow label="Method" value={selectedLog.action.method} />
        <DetailRow label="Route" value={selectedLog.action.route} />
        <div className="flex h-9 items-center justify-between gap-x-10 px-4 pl-[22px]">
          <span className="shrink-0 text-xs uppercase tracking-wide text-foreground-lighter font-mono">
            Status
          </span>
          <DataTableColumnStatusCode
            value={selectedLog.action.status}
            level={getStatusLevel(selectedLog.action.status)}
            className="text-xs"
          />
        </div>
        <DetailRow
          label="Metadata"
          value={hasMetadata ? JSON.stringify(selectedLog.action.metadata) : undefined}
        />
      </DetailSection>
    </div>
  )
}

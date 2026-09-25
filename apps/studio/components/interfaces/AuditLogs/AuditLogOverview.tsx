import dayjs from 'dayjs'
import { Activity, Clock, Copy, Globe, Hash, User } from 'lucide-react'
import { Button, cn, copyToClipboard } from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { getStatusLevel } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import { CollapsibleDetailSection } from '@/components/ui/DataTable/CollapsibleDetailSection'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { DetailSectionHeader } from '@/components/ui/DataTable/DetailSectionHeader'
import {
  TIMESTAMP_MICROS_PER_MS,
  type AuditLog,
} from '@/data/organizations/organization-audit-logs-query'

interface AuditLogOverviewProps {
  selectedLog: AuditLog
}

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
      <span className="shrink-0 text-sm text-foreground-lighter">{label}</span>
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

export const AuditLogOverview = ({ selectedLog }: AuditLogOverviewProps) => {
  const hasMetadata = Object.keys(selectedLog.action.metadata ?? {}).length > 0

  return (
    <div>
      <DetailSectionHeader
        title="Request started"
        icon={Clock}
        className="border-b"
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
        className="border-b"
        summary={
          <span className="truncate text-right font-mono text-xs text-foreground">
            {selectedLog.request_id}
          </span>
        }
      />

      <CollapsibleDetailSection defaultOpen className="border-b" title="Target" icon={Globe}>
        <DetailRow label="Organization slug" value={selectedLog.organization_slug} />
        <DetailRow label="Project ref" value={selectedLog.project_ref} />
      </CollapsibleDetailSection>

      <CollapsibleDetailSection defaultOpen className="border-b" title="Actor" icon={User}>
        <DetailRow label="Token type" value={selectedLog.actor.token_type} />
        <DetailRow label="Email" value={selectedLog.actor.email} />
        <DetailRow label="User ID" value={selectedLog.actor.user_id} />
        <DetailRow label="IP address" value={selectedLog.actor.ip} />
      </CollapsibleDetailSection>

      <CollapsibleDetailSection defaultOpen className="border-b" title="Action" icon={Activity}>
        <DetailRow label="Name" value={selectedLog.action.name} />
        <DetailRow label="Method" value={selectedLog.action.method} />
        <DetailRow label="Route" value={selectedLog.action.route} />
        <div className="flex h-9 items-center justify-between gap-x-10 px-4 pl-[38px]">
          <span className="shrink-0 text-sm text-foreground-lighter">Status</span>
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
      </CollapsibleDetailSection>
    </div>
  )
}

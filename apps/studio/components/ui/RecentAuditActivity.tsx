import { Database, RefreshCw, User } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button, cn } from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { LogDetailsPanel } from '@/components/interfaces/AuditLogs/LogDetailsPanel'
import type { AuditLog } from '@/data/organizations/organization-audit-logs-query'
import type { DdlLogEntry } from '@/hooks/analytics/useProjectDdlLogs'

export type AuditEntry = { source: 'api'; log: AuditLog } | { source: 'ddl'; log: DdlLogEntry }

interface RecentAuditActivityProps {
  entries: AuditEntry[]
  isLoading: boolean
  hasAccess?: boolean
  viewAllHref?: string
  title?: string
  description?: string
  onRefresh?: () => void
}

function StatusBadge({ status }: { status: number }) {
  const s = String(status)
  const is2xx = s.startsWith('2')
  const is4xx = s.startsWith('4')
  const is5xx = s.startsWith('5')
  return (
    <div
      className={cn(
        'flex items-center justify-center border px-1.5 py-0.5 rounded-sm text-xs font-mono',
        is2xx && 'text-brand border-brand bg-brand-300',
        is4xx && 'text-warning border-warning bg-warning-300',
        is5xx && 'text-destructive border-destructive bg-destructive-300',
        !is2xx && !is4xx && !is5xx && 'text-foreground-light border-default bg-surface-200'
      )}
    >
      {status}
    </div>
  )
}

function ApiEntryRow({ log, onClick }: { log: AuditLog; onClick: (log: AuditLog) => void }) {
  const actor = log.actor.email ?? log.actor.app_name ?? log.actor.oauth_app_name ?? 'Unknown'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(log)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(log)
        }
      }}
      className="group flex items-center font-mono px-3 py-2 gap-3 bg-surface-100 cursor-pointer hover:bg-surface-200 transition-colors"
    >
      <span className="text-xs text-foreground-light whitespace-nowrap">
        <TimestampInfo utcTimestamp={log.timestamp} format="DD MMM YY, HH:mm:ss" />
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <User size={10} className="text-foreground-muted" />
        <span className="text-xs text-foreground-light truncate max-w-32" title={actor}>
          {actor}
        </span>
      </div>
      <span className="flex-1 text-xs text-foreground truncate" title={log.action.name}>
        {log.action.name}
      </span>
      <StatusBadge status={log.action.status} />
    </div>
  )
}

function DdlEntryRow({ log }: { log: DdlLogEntry }) {
  return (
    <div className="flex items-center font-mono px-3 py-2 gap-3 bg-surface-100">
      <span className="text-xs text-foreground-light whitespace-nowrap">
        <TimestampInfo utcTimestamp={log.timestamp} format="DD MMM YY, HH:mm:ss" />
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <Database size={10} className="text-foreground-muted" />
        <span className="text-xs text-foreground-muted truncate max-w-32" title={log.db_user}>
          {log.db_user || 'postgres'}
        </span>
      </div>
      <span className="flex-1 text-xs text-foreground-light truncate" title={log.event_message}>
        <span className="text-foreground font-medium">{log.command_tag}</span>
        {log.event_message ? ` — ${log.event_message}` : ''}
      </span>
    </div>
  )
}

export function RecentAuditActivity({
  entries,
  isLoading,
  hasAccess = true,
  viewAllHref,
  title = 'Recent Changes',
  description = 'Recent configuration changes for this resource',
  onRefresh,
}: RecentAuditActivityProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog>()

  return (
    <>
      <div className="flex flex-col gap-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">{title}</p>
            <p className="text-xs text-foreground-light">{description}</p>
          </div>
          {onRefresh && (
            <Button
              type="default"
              loading={isLoading}
              disabled={isLoading}
              icon={<RefreshCw size={14} />}
              onClick={onRefresh}
            >
              Refresh
            </Button>
          )}
        </div>

        {isLoading ? (
          <GenericSkeletonLoader />
        ) : !hasAccess && entries.length === 0 ? (
          <Admonition
            type="default"
            title="Management API audit logs unavailable"
            description={
              <span>
                Upgrade to Team or Enterprise plan to see who made changes via the Management API.{' '}
                {viewAllHref && (
                  <Link href={viewAllHref} className="text-foreground-light underline">
                    View audit logs
                  </Link>
                )}
              </span>
            }
          />
        ) : entries.length === 0 ? (
          <Admonition
            type="note"
            title="No recent changes"
            description="Configuration changes will appear here"
          />
        ) : (
          <div className="border rounded-md divide-y overflow-hidden">
            {entries.map((entry) =>
              entry.source === 'api' ? (
                <ApiEntryRow
                  key={`api-${entry.log.request_id}`}
                  log={entry.log}
                  onClick={setSelectedLog}
                />
              ) : (
                <DdlEntryRow key={`ddl-${entry.log.id}`} log={entry.log} />
              )
            )}
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="flex items-center justify-center py-2 text-xs text-foreground-light hover:text-foreground transition-colors"
              >
                View all in Audit Logs →
              </Link>
            )}
          </div>
        )}
      </div>

      <LogDetailsPanel selectedLog={selectedLog} onClose={() => setSelectedLog(undefined)} />
    </>
  )
}

import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { Badge, cn, Sheet, SheetContent, SheetHeader, SheetSection, SheetTitle } from 'ui'

import { levelBadgeVariant, type UserActivityEvent } from './UserActivity.constants'
import { LogsList } from '@/components/interfaces/UnifiedLogs/components/LogsList'
import { LOG_TYPES_LABELS } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'

interface UserActivityEventDetailSheetProps {
  event: UserActivityEvent | null
  onClose: () => void
}

export const UserActivityEventDetailSheet = ({
  event,
  onClose,
}: UserActivityEventDetailSheetProps) => {
  const logTypeLabel = event
    ? (LOG_TYPES_LABELS[event.logType as keyof typeof LOG_TYPES_LABELS] ?? event.logType)
    : null
  const hasHeaders = event ? Object.keys(event.headers).length > 0 : false

  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="default" className="flex flex-col h-full gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>Event details</SheetTitle>
        </SheetHeader>
        {event && (
          <div className="flex-1 overflow-y-auto">
            <SheetSection className="flex flex-col gap-y-3 border-b">
              <DetailRow
                label="Timestamp"
                value={dayjs(event.timestampMs).format('MMM D, YYYY HH:mm:ss')}
              />
              <DetailRow label="Log type" value={logTypeLabel} />
              {(event.method || event.pathname) && (
                <DetailRow
                  label="Request"
                  value={`${event.method ?? ''} ${event.pathname ?? ''}`.trim()}
                  mono
                />
              )}
              <DetailRow
                label="Status"
                value={
                  event.status !== null ? (
                    <Badge variant={levelBadgeVariant(event.level)}>{event.status}</Badge>
                  ) : (
                    '—'
                  )
                }
              />
            </SheetSection>

            <SheetSection className="flex flex-col gap-y-2 border-b">
              <p className="text-xs text-foreground-lighter uppercase">Message</p>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-surface-200 rounded-md p-3">
                {event.eventMessage || '—'}
              </pre>
            </SheetSection>

            {hasHeaders && (
              <SheetSection className="flex flex-col gap-y-2 border-b">
                <p className="text-xs text-foreground-lighter uppercase">Headers</p>
                <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-surface-200 rounded-md p-3">
                  {JSON.stringify(event.headers, null, 2)}
                </pre>
              </SheetSection>
            )}

            {event.logs.length > 0 && (
              <div className="flex flex-col">
                <p className="text-xs text-foreground-lighter uppercase px-5 pt-4">Function logs</p>
                <LogsList logs={event.logs} />
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

const DetailRow = ({
  label,
  value,
  mono = false,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) => (
  <div className="flex items-center justify-between gap-x-4">
    <span className="text-xs text-foreground-lighter">{label}</span>
    <span className={cn('text-sm text-foreground', mono && 'font-mono text-xs')}>{value}</span>
  </div>
)

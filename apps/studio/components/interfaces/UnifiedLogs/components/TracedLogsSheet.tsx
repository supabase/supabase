import { useParams } from 'common'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetSection, SheetTitle } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ColumnSchema } from '../UnifiedLogs.schema'
import { LogsList } from './LogsList'
import CopyButton from '@/components/ui/CopyButton'
import { DataTableColumnStatusCode } from '@/components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { useTracedLogBundleQuery } from '@/data/logs/traced-log-bundle-query'

interface TracedLogsSheetProps {
  row: ColumnSchema | null
  onClose: () => void
}

export const TracedLogsSheet = ({ row, onClose }: TracedLogsSheetProps) => {
  const { ref: projectRef } = useParams()

  const { data: logs, isLoading } = useTracedLogBundleQuery(
    { projectRef, requestId: row?.id, bundleTimestampMs: row?.date.getTime() },
    { enabled: !!row }
  )

  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent size="default" className="flex flex-col h-full gap-0">
        <SheetHeader className="border-b">
          <SheetTitle>Traced request</SheetTitle>
        </SheetHeader>
        {row && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <SheetSection className="flex flex-col gap-y-3 border-b">
              <DetailRow
                label="Request ID"
                value={
                  <span className="flex items-center gap-1">
                    {row.id}
                    <CopyButton iconOnly variant="default" text={row.id} />
                  </span>
                }
                mono
              />
              <DetailRow label="Timestamp" value={dayjs(row.date).format('MMM D, YYYY HH:mm:ss')} />
              {(row.method || row.pathname) && (
                <DetailRow
                  label="Request"
                  value={`${row.method ?? ''} ${row.pathname ?? ''}`.trim()}
                  mono
                />
              )}
              <DetailRow
                label="Status"
                value={<DataTableColumnStatusCode value={row.status} level={row.level} />}
              />
            </SheetSection>

            <div className="flex flex-col grow">
              <p className="text-xs text-foreground-lighter uppercase px-5 pt-4">
                Log lines ({row.log_count ?? '…'})
              </p>
              {isLoading ? (
                <div className="p-4">
                  <GenericSkeletonLoader />
                </div>
              ) : (
                <LogsList logs={logs} />
              )}
            </div>
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
    <span className="text-xs text-foreground-lighter shrink-0">{label}</span>
    <span
      className={mono ? 'text-sm text-foreground font-mono text-xs' : 'text-sm text-foreground'}
    >
      {value}
    </span>
  </div>
)

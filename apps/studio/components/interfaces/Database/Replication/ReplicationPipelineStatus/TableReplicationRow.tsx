import { useParams } from 'common'
import { TableEditor } from 'icons'
import { MoreVertical, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'

import { ErroredTableDetails } from '../ErroredTableDetails'
import { StateDot } from '../StateDot'
import { SlotLagMetrics as SlotLagMetricsType, TableState } from './ReplicationPipelineStatus.types'
import { getStatusConfig, getTableSyncLagLabel } from './ReplicationPipelineStatus.utils'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'

interface TableReplicationRowProps {
  table: ReplicationPipelineTableStatus
  isRestarting: boolean
  showDisabledState: boolean
  disabledStateMessage: string
  isAnyRestartInProgress: boolean
  isPipelineStopped: boolean
  onSelectRestart: () => void
  onSelectShowError: () => void
}

export const TableReplicationRow = ({
  table,
  isRestarting,
  showDisabledState,
  disabledStateMessage,
  isAnyRestartInProgress,
  isPipelineStopped,
  onSelectRestart,
  onSelectShowError,
}: TableReplicationRowProps) => {
  const { ref } = useParams()
  const statusConfig = getStatusConfig(table.state as TableState['state'])
  const tableName = `${table.schema}.${table.name}`
  const canRestart = !showDisabledState && !isRestarting && !isAnyRestartInProgress
  const restartLabel = isPipelineStopped
    ? 'Reset table and start pipeline'
    : 'Reset table and restart pipeline'

  const isErrorState = table.state.name === 'error'
  const canShowError =
    isErrorState && 'reason' in table.state && !showDisabledState && !isRestarting
  // A table copying during the initial sync reports its own slot metrics. Shown as one line rather
  // than a grid, so the detail survives without a table cell turning into a dashboard.
  const syncLag = table.table_sync_lag as SlotLagMetricsType | undefined
  const syncLagParts = syncLag === undefined ? undefined : getTableSyncLagLabel(syncLag)
  const syncLagLabel =
    syncLagParts !== undefined && syncLagParts.length > 0 ? syncLagParts.join(' · ') : undefined
  // Status column already names the state (Copying, Queued, …). Prefer the sync line when we have
  // one; keep the description only when it adds something the status label doesn't say.
  const detailsLine =
    syncLagLabel !== undefined ? syncLagLabel : isErrorState ? undefined : statusConfig.description

  return (
    <TableRow>
      <TableCell>{tableName}</TableCell>

      <TableCell>
        {isRestarting ? (
          <StateDot variant="warning" isPulsing>
            Restarting
          </StateDot>
        ) : showDisabledState ? (
          <StateDot variant="default">Not available</StateDot>
        ) : (
          <StateDot
            variant={statusConfig.variant}
            isPulsing={statusConfig.isPulsing}
            pulseDelayMs={statusConfig.isPulsing ? (table.id % 8) * 55 : undefined}
          >
            {statusConfig.label}
          </StateDot>
        )}
      </TableCell>

      <TableCell>
        {isRestarting ? (
          <p className="text-sm text-foreground-lighter">
            Being reset. The pipeline will restart itself…
          </p>
        ) : showDisabledState ? (
          <p className="text-sm text-foreground-lighter">{disabledStateMessage}</p>
        ) : (
          <p className="text-sm text-foreground-lighter">
            {isErrorState ? (
              <>
                {statusConfig.description}. <ErroredTableDetails table={table} />
              </>
            ) : (
              detailsLine
            )}
          </p>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-x-2">
          {canShowError && (
            <Button variant="default" onClick={onSelectShowError}>
              View error
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="px-1.25 hit-area-2"
                aria-label={`Options for ${tableName}`}
                icon={<MoreVertical />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-64">
              <DropdownMenuItemTooltip
                className="gap-x-2"
                disabled={!canRestart}
                onClick={onSelectRestart}
                tooltip={{
                  content: {
                    side: 'left',
                    text: canRestart ? undefined : disabledStateMessage,
                  },
                }}
              >
                <RotateCcw size={14} />
                <span>{restartLabel}</span>
              </DropdownMenuItemTooltip>
              <DropdownMenuItem className="gap-x-2" asChild>
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`/project/${ref}/editor/${table.id}`}
                >
                  <TableEditor size={14} />
                  <span>View in Table Editor</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

import { useParams } from 'common'
import { ExternalLink, MoreVertical, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'

import { DetailSubtext } from '../DetailSubtext'
import { ErroredTableDetails } from '../ErroredTableDetails'
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
    : 'Reset and restart pipeline'

  const isErrorState = table.state.name === 'error'
  const canShowError =
    isErrorState && 'reason' in table.state && !showDisabledState && !isRestarting
  // A table copying during the initial sync reports its own slot metrics. Shown as one line rather
  // than a grid, so the detail survives without a table cell turning into a dashboard.
  const syncLag = table.table_sync_lag as SlotLagMetricsType | undefined
  const syncLagLabel = syncLag === undefined ? undefined : getTableSyncLagLabel(syncLag).join(' · ')

  return (
    <TableRow>
      <TableCell className="align-top">{tableName}</TableCell>

      <TableCell className="align-top">
        {isRestarting ? (
          <Badge variant="default">Restarting</Badge>
        ) : showDisabledState ? (
          <Badge variant="default">Not Available</Badge>
        ) : (
          statusConfig.badge
        )}
      </TableCell>

      <TableCell className="align-top">
        {isRestarting ? (
          <p className="text-sm text-foreground-lighter">
            Replication is being restarted for this table. The pipeline will restart automatically.
          </p>
        ) : showDisabledState ? (
          <p className="text-sm text-foreground-lighter">{disabledStateMessage}</p>
        ) : (
          <div className="flex flex-col gap-y-1">
            <p className="text-sm text-foreground-lighter">{statusConfig.description}</p>
            {syncLagLabel !== undefined && <DetailSubtext>{syncLagLabel}</DetailSubtext>}
            {isErrorState && <ErroredTableDetails table={table} />}
          </div>
        )}
      </TableCell>

      <TableCell className="align-top">
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
                className="w-7 hit-area-2"
                aria-label={`Options for ${tableName}`}
                icon={<MoreVertical />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-56">
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
                  <ExternalLink size={14} />
                  <span>Open in Table Editor</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

import { useParams } from 'common'
import { ExternalLink, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { ErroredTableDetails } from '../ErroredTableDetails'
import { TableState } from './ReplicationPipelineStatus.types'
import { getStatusConfig } from './ReplicationPipelineStatus.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'

interface TableReplicationRowProps {
  table: ReplicationPipelineTableStatus
  showDisabledState: boolean
  disabledStateMessage: string
  isActionPending: boolean
  isPipelineStopped: boolean
  onSelectRestart: () => void
  onSelectShowError: () => void
}

export const TableReplicationRow = ({
  table,
  showDisabledState,
  disabledStateMessage,
  isActionPending,
  isPipelineStopped,
  onSelectRestart,
  onSelectShowError,
}: TableReplicationRowProps) => {
  const { ref } = useParams()
  const isErrorState = table.state.name === 'error'
  const statusConfig = getStatusConfig(table.state as TableState['state'])

  return (
    <TableRow>
      <TableCell className="align-top">
        <div className="flex items-center gap-x-2">
          <p>
            {table.schema}.{table.name}
          </p>

          <ButtonTooltip
            asChild
            variant="text"
            className="px-1.5"
            icon={<ExternalLink />}
            tooltip={{
              content: { side: 'bottom', text: 'Table Editor' },
            }}
          >
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`/project/${ref}/editor/${table.id}`}
            />
          </ButtonTooltip>
        </div>
      </TableCell>

      <TableCell className="align-top">
        {showDisabledState ? <Badge variant="default">Not Available</Badge> : statusConfig.badge}
      </TableCell>

      <TableCell className="align-top">
        {showDisabledState && (
          <p className="text-sm text-foreground-lighter">{disabledStateMessage}</p>
        )}
        {!showDisabledState && (
          <div className="flex flex-col gap-y-3">
            <div className="text-sm text-foreground">
              {statusConfig.description}{' '}
              {isErrorState && 'reason' in table.state && (
                <button
                  tabIndex={0}
                  className={InlineLinkClassName}
                  onClick={() => onSelectShowError()}
                >
                  View error.
                </button>
              )}
            </div>
            {table.state.name === 'error' && <ErroredTableDetails table={table} />}
          </div>
        )}
      </TableCell>

      <TableCell className="align-top">
        <div className="flex items-center justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="w-7"
                icon={<RotateCcw />}
                disabled={showDisabledState || isActionPending}
                aria-label={`Restart replication for ${table.schema}.${table.name}`}
                onClick={onSelectRestart}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              {isPipelineStopped
                ? 'Restart replication when the pipeline is started'
                : 'Restart replication'}
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  )
}

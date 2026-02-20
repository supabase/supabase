import { ExternalLink, RotateCcw } from 'lucide-react'
import Link from 'next/link'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'
import { useParams } from 'common'
import { Badge, Button, cn, TableCell, TableRow, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ErroredTableDetails } from '../ErroredTableDetails'
import { TableState } from './ReplicationPipelineStatus.types'
import { getDisabledStateConfig, getStatusConfig } from './ReplicationPipelineStatus.utils'

interface TableReplicationRowProps {
  table: ReplicationPipelineTableStatus
  config: ReturnType<typeof getDisabledStateConfig>
  isRestarting: boolean
  showDisabledState: boolean
  onSelectRestart: () => void
  onSelectShowError: () => void
}

export const TableReplicationRow = ({
  table,
  config,
  isRestarting,
  showDisabledState,
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
          <p className={cn(isRestarting && 'text-foreground-light')}>{table.table_name}</p>

          <ButtonTooltip
            asChild
            type="text"
            className="px-1.5"
            icon={<ExternalLink />}
            tooltip={{
              content: { side: 'bottom', text: 'Open in Table Editor' },
            }}
          >
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`/project/${ref}/editor/${table.table_id}`}
            />
          </ButtonTooltip>
        </div>
      </TableCell>

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
          <p className="text-sm text-foreground-lighter">
            Status unavailable while pipeline is {config.badge.toLowerCase()}
          </p>
        ) : (
          <div className="flex flex-col gap-y-3">
            <div className="text-sm text-foreground">
              {statusConfig.description}{' '}
              {isErrorState && 'reason' in table.state && (
                <button className={InlineLinkClassName} onClick={() => onSelectShowError()}>
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
                type="default"
                className="w-7"
                icon={<RotateCcw />}
                disabled={showDisabledState || isRestarting}
                aria-label={`Restart replication for ${table.table_name}`}
                onClick={onSelectRestart}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              Restart table replication
            </TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  )
}

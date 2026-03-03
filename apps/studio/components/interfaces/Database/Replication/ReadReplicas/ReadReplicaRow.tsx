import { useParams } from 'common'
import { Database as DatabaseIcon } from 'icons'
import { Loader2, Minus, MoreVertical, RotateCcw, Trash } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AWS_REGIONS } from 'shared-data'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

import { getIsInTransition, getStatusLabel } from './ReadReplicas.utils'
import { DropReplicaConfirmationModal } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/DropReplicaConfirmationModal'
import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { RestartReplicaConfirmationModal } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/RestartReplicaConfirmationModal'
import { useReplicationLagQuery } from '@/data/read-replicas/replica-lag-query'
import { type Database } from '@/data/read-replicas/replicas-query'
import { formatDatabaseID } from '@/data/read-replicas/replicas.utils'

interface ReadReplicaRow {
  replica: Database
  onUpdateReplica: () => void
}

export const ReadReplicaRow = ({ replica, onUpdateReplica }: ReadReplicaRow) => {
  const { ref } = useParams()
  const { identifier, region, status } = replica
  const formattedId = formatDatabaseID(identifier ?? '')

  const {
    data: lagDuration,
    isPending: isLoadingLag,
    isError: isErrorLag,
  } = useReplicationLagQuery(
    {
      id: identifier,
      projectRef: ref,
      connectionString: replica.connectionString,
    },
    { enabled: status === REPLICA_STATUS.ACTIVE_HEALTHY }
  )

  const [showConfirmRestart, setShowConfirmRestart] = useState(false)
  const [showConfirmDrop, setShowConfirmDrop] = useState(false)

  const regionMeta = Object.values(AWS_REGIONS).find((x) => x.code === region)

  const isInTransition = useMemo(() => getIsInTransition({ status }), [status])
  const statusLabel = useMemo(() => getStatusLabel({ status }), [status])

  return (
    <>
      <TableRow>
        <TableCell>
          <DatabaseIcon size={18} className="text-foreground-light" />
        </TableCell>

        <TableCell>
          <div>
            <p>Read Replica (ID: {formattedId})</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-foreground-lighter w-fit">{regionMeta?.displayName}</p>
              </TooltipTrigger>
              <TooltipContent side="right">{regionMeta?.code}</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-x-2">
            <Badge
              variant={
                statusLabel === 'Healthy'
                  ? 'success'
                  : statusLabel === 'Failed'
                    ? 'destructive'
                    : 'default'
              }
            >
              {statusLabel}
            </Badge>
            {isInTransition && <Loader2 className="animate-spin w-3 h-3" />}
          </div>
        </TableCell>

        <TableCell>
          {isErrorLag || status !== REPLICA_STATUS.ACTIVE_HEALTHY ? (
            <Minus size={18} className="text-foreground-lighter" />
          ) : isLoadingLag ? (
            <ShimmeringLoader />
          ) : (
            <p>{lagDuration}s</p>
          )}
        </TableCell>

        <TableCell>
          <Minus size={18} className="text-foreground-lighter" />
        </TableCell>

        <TableCell>
          <div className="flex items-center justify-end gap-x-2">
            <Button asChild type="default" className="relative" disabled={status === 'GOING_DOWN'}>
              <Link href={`/project/${ref}/database/replication/replica/${replica.identifier}`}>
                View replication
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button type="default" icon={<MoreVertical />} className="w-7" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  className="gap-x-2"
                  disabled={status !== 'ACTIVE_HEALTHY'}
                  onClick={() => setShowConfirmRestart(true)}
                >
                  <RotateCcw size={14} />
                  <span>Restart replica</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-x-2"
                  disabled={status === 'GOING_DOWN'}
                  onClick={() => setShowConfirmDrop(true)}
                >
                  <Trash size={14} />
                  <span>Drop replica</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      <DropReplicaConfirmationModal
        selectedReplica={showConfirmDrop ? replica : undefined}
        onSuccess={() => onUpdateReplica()}
        onCancel={() => setShowConfirmDrop(false)}
      />

      <RestartReplicaConfirmationModal
        selectedReplica={showConfirmRestart ? replica : undefined}
        onSuccess={() => onUpdateReplica()}
        onCancel={() => setShowConfirmRestart(false)}
      />
    </>
  )
}

import { Loader2, Minus, MoreVertical, RotateCcw, Trash } from 'lucide-react'
import { useMemo, useState } from 'react'

import DropReplicaConfirmationModal from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/DropReplicaConfirmationModal'
import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { RestartReplicaConfirmationModal } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/RestartReplicaConfirmationModal'
import { useReplicationLagQuery } from '@/data/read-replicas/replica-lag-query'
import { type Database } from '@/data/read-replicas/replicas-query'
import {
  DatabaseStatus,
  ReplicaInitializationStatus,
} from '@/data/read-replicas/replicas-status-query'
import { formatDatabaseID } from '@/data/read-replicas/replicas.utils'
import { useParams } from 'common'
import { Database as DatabaseIcon } from 'icons'
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
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

interface ReadReplicaRow {
  replica: Database
  replicaStatus?: DatabaseStatus
  onUpdateReplica: () => void
}

export const ReadReplicaRow = ({ replica, replicaStatus, onUpdateReplica }: ReadReplicaRow) => {
  const { ref } = useParams()
  const { identifier, region, status: baseStatus } = replica

  const status = replicaStatus?.status ?? baseStatus
  const replicaInitializationStatus = replicaStatus?.replicaInitializationStatus
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

  const initStatus = replicaInitializationStatus?.status
  const regionLabel = Object.values(AWS_REGIONS).find((x) => x.code === region)?.displayName

  const isInTransition =
    (
      [
        REPLICA_STATUS.UNKNOWN,
        REPLICA_STATUS.COMING_UP,
        REPLICA_STATUS.GOING_DOWN,
        REPLICA_STATUS.RESTORING,
        REPLICA_STATUS.RESTARTING,
        REPLICA_STATUS.RESIZING,
        REPLICA_STATUS.INIT_READ_REPLICA,
      ] as string[]
    ).includes(status) || initStatus === ReplicaInitializationStatus.InProgress

  const statusLabel = useMemo(() => {
    if (
      initStatus === ReplicaInitializationStatus.InProgress ||
      status === REPLICA_STATUS.COMING_UP ||
      status === REPLICA_STATUS.UNKNOWN ||
      status === REPLICA_STATUS.INIT_READ_REPLICA
    ) {
      return 'Coming up'
    }

    if (
      initStatus === ReplicaInitializationStatus.Failed ||
      status === REPLICA_STATUS.INIT_READ_REPLICA_FAILED
    ) {
      return 'Failed'
    }

    switch (status) {
      case REPLICA_STATUS.GOING_DOWN:
        return 'Going down'
      case REPLICA_STATUS.RESTARTING:
        return 'Restarting'
      case REPLICA_STATUS.RESIZING:
        return 'Resizing'
      case REPLICA_STATUS.RESTORING:
        return 'Restoring'
      case REPLICA_STATUS.ACTIVE_HEALTHY:
        return 'Healthy'
      default:
        return 'Unhealthy'
    }
  }, [initStatus, status])

  return (
    <>
      <TableRow>
        <TableCell>
          <DatabaseIcon size={18} className="text-foreground-light" />
        </TableCell>

        <TableCell>
          <div>
            <p>{regionLabel}</p>
            <p className="text-foreground-lighter">Read Replica (ID: {formattedId})</p>
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
            {/* [Joshen] Temporarily hidden - will work on the replica detail page in another PR */}
            {/* <Button asChild type="default" className="relative">
              <Link href={`/project/${ref}/database/replication`}>View replication</Link>
            </Button> */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button type="default" icon={<MoreVertical />} className="w-7" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem className="gap-x-2" onClick={() => setShowConfirmRestart(true)}>
                  <RotateCcw size={14} />
                  <span>Restart replica</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-x-2" onClick={() => setShowConfirmDrop(true)}>
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

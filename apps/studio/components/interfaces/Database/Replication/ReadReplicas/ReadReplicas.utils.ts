import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { ReplicaInitializationStatus } from '@/data/read-replicas/replicas-status-query'

export const getIsInTransition = ({
  initStatus,
  status,
}: {
  initStatus?: string
  status?: string
}) => {
  return (
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
    ).includes(status ?? '') || initStatus === ReplicaInitializationStatus.InProgress
  )
}

export const getStatusLabel = ({
  initStatus,
  status,
}: {
  initStatus?: string
  status?: string
}) => {
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
}

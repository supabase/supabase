import { CloneStatus } from 'data/projects/clone-status-query'
import { Badge } from 'ui'

export const StatusBadge = ({
  status,
}: {
  status: NonNullable<CloneStatus['clones']>[number]['status']
}) => {
  const statusTextMap = {
    IN_PROGRESS: 'RESTORING',
    COMPLETED: 'COMPLETED',
    REMOVED: 'REMOVED',
    FAILED: 'FAILED',
  }

  if (status === 'IN_PROGRESS') {
    return <Badge variant="warning">{statusTextMap[status]}</Badge>
  }

  if (status === 'FAILED') {
    return <Badge variant="destructive">{statusTextMap[status]}</Badge>
  }

  return <Badge>{statusTextMap[status]}</Badge>
}

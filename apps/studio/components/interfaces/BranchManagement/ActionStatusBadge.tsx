import { ActionStatus } from 'data/actions/action-runs-query'
import { Badge } from 'ui'
import { StatusIcon } from 'ui'

type Status = ActionStatus

export interface ActionStatusBadgeProps {
  status: Status
}

export const UNHEALTHY_STATUES: Status[] = ['DEAD', 'REMOVING']
export const WAITING_STATUSES: Status[] = ['CREATED', 'RESTARTING', 'RUNNING']

const STATUS_TO_LABEL: Record<Status, string> = {
  CREATED: 'Created',
  DEAD: 'Dead',
  EXITED: 'Exited',
  PAUSED: 'Paused',
  REMOVING: 'Removing',
  RESTARTING: 'Restarting',
  RUNNING: 'Running',
}

const ActionStatusBadge = ({ status }: ActionStatusBadgeProps) => {
  if (status === 'EXITED') {
    return null
  }

  const isUnhealthy = UNHEALTHY_STATUES.includes(status)
  const isWaiting = WAITING_STATUSES.includes(status)

  return (
    <Badge variant={isUnhealthy ? 'destructive' : 'default'} className="gap-1.5">
      {(isUnhealthy || isWaiting) && (
        <StatusIcon variant={isUnhealthy ? 'destructive' : 'default'} hideBackground />
      )}
      {STATUS_TO_LABEL[status]}
    </Badge>
  )
}

export default ActionStatusBadge

import { ActionName, ActionStatus } from 'data/actions/action-runs-query'
import { Badge } from 'ui'
import { StatusIcon } from 'ui'

export interface ActionStatusBadgeProps {
  name: ActionName
  status: ActionStatus
}

const UNHEALTHY_STATUES: ActionStatus[] = ['DEAD', 'REMOVING']
const WAITING_STATUSES: ActionStatus[] = ['CREATED', 'RESTARTING', 'RUNNING']

const STATUS_TO_LABEL: Record<ActionStatus, string> = {
  CREATED: 'pending',
  DEAD: 'failed',
  EXITED: 'succeeded',
  PAUSED: 'skipped',
  REMOVING: 'failed',
  RESTARTING: 'restarting',
  RUNNING: 'running',
}

const NAME_TO_LABEL: Record<ActionName, string> = {
  clone: 'Cloning repo',
  pull: 'Pulling data',
  health: 'Health check',
  configure: 'Configurations',
  migrate: 'Migrations',
  seed: 'Data seeding',
  deploy: 'Functions deployment',
}

const ActionStatusBadge = ({ name, status }: ActionStatusBadgeProps) => {
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
      {NAME_TO_LABEL[name]}: {STATUS_TO_LABEL[status]}
    </Badge>
  )
}

export default ActionStatusBadge

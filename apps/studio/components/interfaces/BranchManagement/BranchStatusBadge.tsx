import type { BranchData } from 'data/branches/branch-query'
import type { Branch } from 'data/branches/branches-query'
import { Badge } from 'ui'
import { StatusIcon } from 'ui'

type Status = Branch['status'] | BranchData['status']

export interface BranchStatusBadgeProps {
  status: Status
}

const UNHEALTHY_STATUES: Status[] = [
  'ACTIVE_UNHEALTHY',
  'INIT_FAILED',
  'UNKNOWN',
  'MIGRATIONS_FAILED',
  'FUNCTIONS_FAILED',
]
const WAITING_STATUSES: Status[] = [
  'COMING_UP',
  'GOING_DOWN',
  'PAUSING',
  'RESTORING',
  'UPGRADING',
  'RUNNING_MIGRATIONS',
]

const STATUS_TO_LABEL: Record<Status, string> = {
  ACTIVE_HEALTHY: 'Healthy',
  ACTIVE_UNHEALTHY: 'Unhealthy',
  INIT_FAILED: 'Init failed',
  UNKNOWN: 'Unknown',
  COMING_UP: 'Coming up',
  GOING_DOWN: 'Going down',
  INACTIVE: 'Inactive',
  PAUSING: 'Pausing',
  REMOVED: 'Removed',
  RESTORING: 'Restoring',
  UPGRADING: 'Upgrading',
  CREATING_PROJECT: 'Creating project',
  RUNNING_MIGRATIONS: 'Running migrations',
  MIGRATIONS_FAILED: 'Migrations failed',
  MIGRATIONS_PASSED: 'Migrations applied successfully',
  FUNCTIONS_DEPLOYED: 'Functions deployed',
  FUNCTIONS_FAILED: 'Functions failed to deploy',
  RESTARTING: 'Restarting',
  RESTORE_FAILED: 'Failed to restore',
  PAUSE_FAILED: 'Failed to pause',
}

const BranchStatusBadge = ({ status }: BranchStatusBadgeProps) => {
  if (status === 'ACTIVE_HEALTHY' || status === 'MIGRATIONS_PASSED') {
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

export default BranchStatusBadge

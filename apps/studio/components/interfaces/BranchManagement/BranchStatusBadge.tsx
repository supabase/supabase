import { WarningIcon } from 'components/ui/Icons'
import type { BranchData } from 'data/branches/branch-query'
import type { Branch } from 'data/branches/branches-query'
import { ClockIcon } from 'lucide-react'
import { Badge } from 'ui'

type Status = Branch['status'] | BranchData['status']

export interface BranchStatusBadgeProps {
  status: Status
}

const UNHEALTHY_STATUES: Status[] = [
  'ACTIVE_UNHEALTHY',
  'INIT_FAILED',
  'UNKNOWN',
  'MIGRATIONS_FAILED',
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
}

const BranchStatusBadge = ({ status }: BranchStatusBadgeProps) => {
  if (status === 'ACTIVE_HEALTHY' || status === 'MIGRATIONS_PASSED') {
    return null
  }

  const isUnhealthy = UNHEALTHY_STATUES.includes(status)
  const isWaiting = WAITING_STATUSES.includes(status)

  return (
    <Badge color={isUnhealthy ? 'red' : 'slate'} className="flex items-center gap-1.5">
      {isUnhealthy && <WarningIcon className="w-3.5 h-3.5 rounded-full bg-red-1000" />}
      {isWaiting && <ClockIcon size={12} />}
      <span>{STATUS_TO_LABEL[status]}</span>
    </Badge>
  )
}

export default BranchStatusBadge

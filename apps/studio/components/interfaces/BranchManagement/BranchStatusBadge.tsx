import { WarningIcon } from 'components/ui/Icons'
import { BranchData } from 'data/branches/branch-query'
import { ClockIcon } from 'lucide-react'
import { Badge } from 'ui'

type Status = BranchData['status']

export interface BranchStatusBadgeProps {
  status: Status
}

const UNHEALTHY_STATUES: Status[] = ['ACTIVE_UNHEALTHY', 'INIT_FAILED', 'UNKNOWN']
const WAITING_STATUSES: Status[] = ['COMING_UP', 'GOING_DOWN', 'PAUSING', 'RESTORING', 'UPGRADING']

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
}

const BranchStatusBadge = ({ status }: BranchStatusBadgeProps) => {
  if (status === 'ACTIVE_HEALTHY') {
    return null
  }

  const isUnhealthy = UNHEALTHY_STATUES.includes(status)
  const isWaiting = WAITING_STATUSES.includes(status)

  return (
    <Badge color={isUnhealthy ? 'red' : 'slate'} className="flex items-center gap-1.5">
      {isUnhealthy && <WarningIcon className="w-3 h-3" />}
      {isWaiting && <ClockIcon size={12} />}
      <span>{STATUS_TO_LABEL[status]}</span>
    </Badge>
  )
}

export default BranchStatusBadge

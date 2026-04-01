import { Badge } from 'ui'

import type { Branch } from '@/data/branches/branches-query'

interface BranchBadgeProps {
  branch: Branch | undefined
  isBranchingEnabled: boolean
}

export function BranchBadge({ branch, isBranchingEnabled }: BranchBadgeProps) {
  if (!isBranchingEnabled) {
    return (
      <Badge variant="warning" className="mt-[1px]">
        Production
      </Badge>
    )
  }

  if (branch?.is_default) {
    return (
      <Badge variant="warning" className="mt-[1px]">
        Production
      </Badge>
    )
  }

  if (branch?.persistent) {
    return (
      <Badge variant="success" className="mt-[1px]">
        Persistent
      </Badge>
    )
  }

  return (
    <Badge variant="success" className="mt-[1px]">
      Preview
    </Badge>
  )
}

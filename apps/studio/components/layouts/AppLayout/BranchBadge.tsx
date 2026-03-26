import type { Branch } from 'data/branches/branches-query'
import { ContextBadge } from 'ui-patterns/ContextBadge'

interface BranchBadgeProps {
  branch: Branch | undefined
  isBranchingEnabled: boolean
}

export function BranchBadge({ branch, isBranchingEnabled }: BranchBadgeProps) {
  if (!isBranchingEnabled) {
    return (
      <ContextBadge variant="warning" className="mt-[1px]">
        Production
      </ContextBadge>
    )
  }

  if (branch?.is_default) {
    return (
      <ContextBadge variant="warning" className="mt-[1px]">
        Production
      </ContextBadge>
    )
  }

  if (branch?.persistent) {
    return (
      <ContextBadge variant="success" className="mt-[1px]">
        Persistent
      </ContextBadge>
    )
  }

  return (
    <ContextBadge variant="success" className="mt-[1px]">
      Preview
    </ContextBadge>
  )
}

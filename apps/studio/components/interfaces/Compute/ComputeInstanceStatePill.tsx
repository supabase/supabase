import { cn } from 'ui'

import { getComputeInstanceStateMeta } from './Compute.constants'
import type { ComputeInstance } from './Compute.types'

interface ComputeInstanceStatePillProps {
  instance: ComputeInstance
  className?: string
}

export const ComputeInstanceStatePill = ({
  instance,
  className,
}: ComputeInstanceStatePillProps) => {
  const meta = getComputeInstanceStateMeta(instance)
  const isPulsing = instance.buildState === 'building' || instance.isDeleting

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-2 w-2">
        {isPulsing && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              meta.dotClassName
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', meta.dotClassName)} />
      </span>
      <span className={cn('text-sm', meta.textClassName)}>{meta.label}</span>
    </span>
  )
}

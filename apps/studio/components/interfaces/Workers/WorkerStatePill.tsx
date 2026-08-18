import { cn } from 'ui'

import { WORKER_STATE_META } from './Workers.constants'
import type { WorkerState } from './Workers.types'

interface WorkerStatePillProps {
  state: WorkerState
  className?: string
}

export const WorkerStatePill = ({ state, className }: WorkerStatePillProps) => {
  const meta = WORKER_STATE_META[state]
  const isPulsing = state === 'deploying' || state === 'draining' || state === 'resuming'

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

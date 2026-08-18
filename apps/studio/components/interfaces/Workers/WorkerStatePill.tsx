import { cn } from 'ui'

import { getWorkerStateMeta } from './Workers.constants'
import type { Worker } from './Workers.types'

interface WorkerStatePillProps {
  worker: Worker
  className?: string
}

export const WorkerStatePill = ({ worker, className }: WorkerStatePillProps) => {
  const meta = getWorkerStateMeta(worker)
  const isPulsing = worker.buildState === 'building' || worker.isDeleting

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

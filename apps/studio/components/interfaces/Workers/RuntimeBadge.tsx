import { cn } from 'ui'

import { getRuntimeMeta } from './Workers.constants'
import type { WorkerRuntime } from './Workers.types'

interface RuntimeBadgeProps {
  runtime: WorkerRuntime
  className?: string
}

/** Small colored swatch + runtime label, e.g. "▪ Python 3.14". */
export const RuntimeBadge = ({ runtime, className }: RuntimeBadgeProps) => {
  const meta = getRuntimeMeta(runtime)
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm text-foreground-light', className)}>
      <span className={cn('h-2.5 w-2.5 rounded-[3px]', meta.swatchClassName)} />
      {meta.label}
    </span>
  )
}

import { cn } from 'ui'

import { formatRuntime, getRuntimeMeta } from './Workers.utils'

interface RuntimeBadgeProps {
  runtime: string | undefined
  className?: string
}

export const RuntimeBadge = ({ runtime, className }: RuntimeBadgeProps) => {
  const meta = getRuntimeMeta(runtime)
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm text-foreground-light', className)}>
      <span
        className={cn('h-2.5 w-2.5 rounded-[3px]', meta?.swatchClassName ?? 'bg-foreground-muted')}
      />
      {formatRuntime(runtime)}
    </span>
  )
}

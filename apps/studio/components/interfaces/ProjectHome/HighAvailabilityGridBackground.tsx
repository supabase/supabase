import { cn } from 'ui'

import { ServerLightGrid } from './ServerLightGrid'

interface HighAvailabilityGridBackgroundProps {
  className?: string
  animated?: boolean
}

export function HighAvailabilityGridBackground({
  className,
  animated = true,
}: HighAvailabilityGridBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none h-full overflow-hidden border-r bg-bg-muted', className)}
    >
      <ServerLightGrid animated={animated} rows={4} cols={4} showActiveGlow={false} />
    </div>
  )
}

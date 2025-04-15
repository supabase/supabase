import { TimingPhase, timingPhases } from 'components/interfaces/DataTableDemo/lib/request/timing'
import {
  getTimingColor,
  getTimingLabel,
  getTimingPercentage,
} from 'components/interfaces/DataTableDemo/lib/request/timing'
import { cn } from 'ui'
import { formatMilliseconds } from 'components/interfaces/DataTableDemo/lib/format'

export function SheetTimingPhases({
  latency,
  timing,
  className,
}: {
  latency: number
  timing: Record<TimingPhase, number>
  className?: string
}) {
  const timingPercentage = getTimingPercentage(timing, latency)
  return (
    <div className={cn('space-y-1 w-full text-left', className)}>
      {timingPhases.map((phase) => (
        <div key={phase} className="grid grid-cols-3 gap-2 text-xs justify-between items-center">
          <div className="text-foreground uppercase truncate font-mono">
            {getTimingLabel(phase)}
          </div>
          <div className="flex gap-2 col-span-2">
            <div className="font-mono text-muted-foreground mr-8">{timingPercentage[phase]}</div>
            <div className="flex flex-1 gap-2 items-center justify-end">
              <div className="font-mono">
                {formatMilliseconds(timing[phase])}
                <span className="text-muted-foreground">ms</span>
              </div>
            </div>
            <div
              className={cn(getTimingColor(phase), 'h-4')}
              style={{ width: `${(timing[phase] / latency) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

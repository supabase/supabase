import { cn } from 'ui'
import { formatMs } from './utils/formats'

type Props = {
  planningTime?: number
  executionTime?: number
  jitTotalTime?: number
  className?: string
}

export const MetaOverlay = ({ planningTime, executionTime, jitTotalTime, className }: Props) => {
  if (planningTime === undefined && executionTime === undefined && jitTotalTime === undefined) {
    return null
  }

  const metrics: { label: string; value: number }[] = []
  if (planningTime !== undefined) metrics.push({ label: 'planning', value: planningTime })
  if (executionTime !== undefined) metrics.push({ label: 'exec', value: executionTime })
  if (jitTotalTime !== undefined) metrics.push({ label: 'jit', value: jitTotalTime })

  return (
    <div
      className={cn(
        'text-xs px-2 py-1 rounded-md border bg-foreground-muted/20 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center gap-x-2">
        {metrics.map((metric) => (
          <span key={metric.label} className="flex items-baseline gap-x-1">
            <span className="text-foreground-lighter">{metric.label}:</span>
            <span>{formatMs(metric.value)} ms</span>
          </span>
        ))}
      </div>
    </div>
  )
}

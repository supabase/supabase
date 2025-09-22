import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { formatMs } from './utils/formats'

type Metric = {
  label: string
  value: number
  description: string
}

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

  const metrics: Metric[] = []
  if (planningTime !== undefined) {
    metrics.push({
      label: 'Plan',
      value: planningTime,
      description:
        'How long PostgreSQL spent preparing the query plan before any rows were processed.',
    })
  }
  if (executionTime !== undefined) {
    metrics.push({
      label: 'Run',
      value: executionTime,
      description: 'Time PostgreSQL needed to execute the plan and produce results.',
    })
  }
  if (jitTotalTime !== undefined) {
    metrics.push({
      label: 'JIT',
      value: jitTotalTime,
      description:
        'Time spent compiling parts of the plan immediately before running (also known as just-in-time compilation).',
    })
  }

  return (
    <div
      className={cn(
        'text-xs px-2 py-1 rounded-md border bg-alternative min-h-[36px] overflow-x-auto',
        className
      )}
    >
      <ul className="flex items-center gap-x-4 overflow-hidden whitespace-nowrap">
        {metrics.map((metric) => {
          const formattedValue = formatMs(metric.value)

          return (
            <li key={metric.label} className="min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex min-w-0 items-center gap-x-1">
                    <span className="shrink-0 text-foreground-light leading-tight font-medium">
                      {metric.label}:
                    </span>
                    <span className="truncate">{formattedValue} ms</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[240px] whitespace-normal text-[11px] leading-4">
                  {metric.description}
                </TooltipContent>
              </Tooltip>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

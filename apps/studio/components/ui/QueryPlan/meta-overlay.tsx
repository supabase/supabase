import { cn } from 'ui'

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

  const parts: string[] = []
  if (planningTime !== undefined) parts.push(`planning: ${planningTime} ms`)
  if (executionTime !== undefined) parts.push(`exec: ${executionTime} ms`)
  if (jitTotalTime !== undefined) parts.push(`jit: ${jitTotalTime} ms`)

  return (
    <div
      className={cn(
        'text-[9px] px-2 py-1 rounded-md border bg-foreground-muted/20 backdrop-blur-sm',
        className
      )}
    >
      <span>{parts.join(', ')}</span>
    </div>
  )
}

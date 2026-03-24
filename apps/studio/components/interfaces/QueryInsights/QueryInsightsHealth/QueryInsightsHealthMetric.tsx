import { cn } from 'ui'

interface QueryInsightsHealthMetricProps {
  label: string
  value: number | string | undefined
  className?: string
  isLoading?: boolean
}

export const QueryInsightsHealthMetric = ({
  label,
  value,
  className,
  isLoading,
}: QueryInsightsHealthMetricProps) => {
  return (
    <div
      className={cn(
        'font-mono text-xs flex items-center justify-between px-4 py-2 h-10',
        className
      )}
    >
      <span className="text-foreground-lighter tracking-wider truncate uppercase">{label}</span>
      {isLoading ? (
        <div className="h-3 w-12 rounded bg-surface-300 animate-pulse" />
      ) : (
        <span className="text-foreground font-medium tabular-nums">{value}</span>
      )}
    </div>
  )
}

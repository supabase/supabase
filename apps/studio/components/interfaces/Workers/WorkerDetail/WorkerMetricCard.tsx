import { cn } from 'ui'

interface WorkerMetricCardProps {
  label: string
  value: string
  sublabel?: string
  intent?: 'default' | 'warning' | 'destructive'
}

const INTENT_CLASS: Record<NonNullable<WorkerMetricCardProps['intent']>, string> = {
  default: 'text-foreground',
  warning: 'text-warning',
  destructive: 'text-destructive',
}

/** Small stat tile for the worker Overview tab (mocked last-24h metrics). */
export const WorkerMetricCard = ({
  label,
  value,
  sublabel,
  intent = 'default',
}: WorkerMetricCardProps) => {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-default bg-surface-100 p-4">
      <span className="text-xs uppercase tracking-wide text-foreground-lighter">{label}</span>
      <span className={cn('text-2xl tabular-nums', INTENT_CLASS[intent])}>{value}</span>
      {sublabel && <span className="text-xs text-foreground-lighter">{sublabel}</span>}
    </div>
  )
}


import { QueryInsightsQuery } from 'data/query-insights/query-insights-query'
import { Button, cn } from 'ui'
import { MetricType } from '../QueryInsights'

interface MetricInfo {
  label: string
  value: string | number
  color?: string
}

interface SelectedQueryBadgeProps {
  selectedQuery: QueryInsightsQuery | null
  onClear: () => void
  className?: string
  metric?: MetricType
  metrics?: MetricInfo[]
}

export const SelectedQueryBadge = ({
  selectedQuery,
  onClear,
  className,
  metric,
  metrics = [],
}: SelectedQueryBadgeProps) => {
  if (!selectedQuery) return null

  return (
    <div
      className={cn(
        'inline-flex items-center p-0 rounded-md text-xs',
        'border-surface-300 dark:border-surface-400',
        'shadow-sm',
        className
      )}
    >
      <Button
        type="default"
        size="tiny"
        onClick={onClear}

      >
        Clear query
      </Button>
    </div>
  )
}

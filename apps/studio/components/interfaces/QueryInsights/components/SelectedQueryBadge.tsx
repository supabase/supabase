import { X } from 'lucide-react'
import { QueryInsightsQuery } from 'data/query-insights/query-insights-query'
import { Button, cn } from 'ui'
import { MetricType } from '../QueryInsights'
import { MetricPill } from './MetricPill'

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
        'inline-flex items-center px-3 pr-2 py-0.5 rounded-full text-xs border',
        'border-surface-300 dark:border-surface-400',
        'shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-foreground-light">Selected Query</span>
        <div className="flex items-center gap-2">
          {metrics.map((metricInfo, index) => (
            <MetricPill
              key={index}
              label={metricInfo.label}
              value={metricInfo.value}
              color={metricInfo.color}
              metricType={metric}
              isActive={true}
            />
          ))}
        </div>
      </div>

      <button
        onClick={onClear}
        className="text-foreground-lighter hover:text-foreground-light ml-1"
        title="Clear selected query filter"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  )
}

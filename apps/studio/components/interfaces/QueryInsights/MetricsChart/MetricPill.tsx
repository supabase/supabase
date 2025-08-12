import { cn } from 'ui'
import { MetricType } from '../QueryInsights'

interface MetricPillProps {
  label: string
  value: string | number
  color?: string
  metricType?: MetricType
  isActive?: boolean
  onClick?: () => void
}

export const MetricPill = ({
  label,
  value,
  color,
  metricType,
  isActive = true,
  onClick,
}: MetricPillProps) => {
  // Get the dot color based on metric type if no color is provided
  const getDotColor = () => {
    if (color) return color

    switch (metricType) {
      case 'query_latency':
        return 'hsl(var(--chart-1))'
      case 'rows_read':
        return 'hsl(var(--chart-2))'
      case 'calls':
        return 'hsl(var(--chart-3))'
      case 'cache_hits':
        return 'hsl(var(--chart-4))'
      default:
        return 'currentColor'
    }
  }

  return (
    <button
      type="button"
      className={cn(
        'text-xs px-2 py-1 rounded-md transition-colors inline-flex items-center gap-1.5 border',
        isActive ? 'border' : 'hover:bg-surface-100 border-dashed'
      )}
      onClick={onClick}
    >
      <div
        className={cn('w-1.5 h-1.5 rounded-full', !isActive && 'opacity-50')}
        style={{
          backgroundColor: getDotColor(),
        }}
      ></div>
      <span className={cn('text-foreground', !isActive && 'text-foreground-light')}>
        <span className="text-foreground-light">{label}:</span> {value}
      </span>
    </button>
  )
}

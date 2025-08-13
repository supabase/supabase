import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { cn } from 'ui'

interface SparkLineProps {
  data?: Array<{ timestamp: string; value: number }>
  trend?: 'up' | 'down' | 'stable'
  className?: string
  color?: string
  height?: number
  width?: number
}

export function SparkLine({ 
  data, 
  trend,
  className, 
  color = 'hsl(var(--chart-1))',
  height = 20,
  width = 60
}: SparkLineProps) {
  // If we have time series data, use it
  if (data && data.length > 0) {
    // Normalize data to fit the small chart
    const values = data.map(point => point.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue
    
    const normalizedData = data.map((point, index) => ({
      ...point,
      index,
      normalizedValue: range > 0 ? (point.value - minValue) / range : 0.5
    }))

    return (
      <div 
        className={cn('inline-block', className)}
        style={{ height, width }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={normalizedData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="normalizedValue"
              stroke={color}
              strokeWidth={1}
              fill="url(#sparkline-gradient)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // If we have a trend indicator, show a simple trend visualization
  if (trend) {
    const trendColor = trend === 'up' ? 'hsl(var(--chart-2))' : 
                      trend === 'down' ? 'hsl(var(--chart-3))' : 
                      'hsl(var(--chart-1))'
    
    const trendData = trend === 'up' ? [
      { x: 0, y: 0.8 }, { x: 1, y: 0.6 }, { x: 2, y: 0.4 }, { x: 3, y: 0.2 }, { x: 4, y: 0 }
    ] : trend === 'down' ? [
      { x: 0, y: 0 }, { x: 1, y: 0.2 }, { x: 2, y: 0.4 }, { x: 3, y: 0.6 }, { x: 4, y: 0.8 }
    ] : [
      { x: 0, y: 0.4 }, { x: 1, y: 0.3 }, { x: 2, y: 0.5 }, { x: 3, y: 0.4 }, { x: 4, y: 0.3 }
    ]

    return (
      <div 
        className={cn('inline-block', className)}
        style={{ height, width }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="sparkline-trend-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={trendColor} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="y"
              stroke={trendColor}
              strokeWidth={1}
              fill="url(#sparkline-trend-gradient)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Fallback for no data
  return (
    <div 
      className={cn(
        'flex items-center justify-center bg-surface-100 rounded',
        className
      )}
      style={{ height, width }}
    >
      <span className="text-xs text-foreground-muted">-</span>
    </div>
  )
} 
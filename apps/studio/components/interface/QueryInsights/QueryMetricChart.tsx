'use client'

import { useMemo } from 'react'
import ComposedChart from 'ui/Charts/ComposedChart'
import { MultiAttribute } from 'ui/Charts/ComposedChart.utils'
import dayjs from 'dayjs'

export interface QueryMetricChartProps {
  data: Array<{
    period_start: string
    timestamp: number
    [key: string]: any
  }>
  attributes: Array<{
    attribute: string
    label: string
    format: string
    color?: {
      light: string
      dark: string
    }
    strokeDasharray?: string
    type?: 'line'
    strokeWidth?: number
  }>
  selectedMetric: 'rows_read' | 'query_latency' | 'calls' | 'cache_hits'
  className?: string
  height?: number
}

export const QueryMetricChart = ({
  data,
  attributes,
  selectedMetric,
  className = '',
  height = 264,
}: QueryMetricChartProps) => {
  // Transform attributes into MultiAttribute format for ComposedChart
  const chartAttributes = useMemo((): MultiAttribute[] => {
    return attributes.map((attr) => ({
      attribute: attr.attribute,
      provider: 'infra-monitoring' as const,
      label: attr.label,
      color: attr.color,
      strokeDasharray: attr.strokeDasharray,
      type: attr.type === 'line' ? 'line' : 'area-bar',
      stackId: '1', // Stack all attributes together
      enabled: true,
    }))
  }, [attributes])

  // Transform data to match ComposedChart's expected format
  const chartData = useMemo(() => {
    return data.map((item) => {
      const transformed: Record<string, any> = {
        timestamp: item.timestamp,
        period_start: item.period_start,
      }

      // Add each attribute value
      attributes.forEach((attr) => {
        transformed[attr.attribute] = item[attr.attribute] || 0
      })

      return transformed
    })
  }, [data, attributes])

  // Determine format based on selected metric
  const getFormat = () => {
    switch (selectedMetric) {
      case 'query_latency':
        return 'ms'
      case 'cache_hits':
        return '%'
      case 'rows_read':
      case 'calls':
      default:
        return ''
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-foreground-lighter">No data available</div>
      </div>
    )
  }

  return (
    <div className={className} style={{ height }}>
      <ComposedChart
        data={chartData}
        attributes={chartAttributes}
        xAxisKey="period_start"
        yAxisKey={attributes[0]?.attribute || 'calls'}
        format={getFormat()}
        title=""
        size="normal"
        showGrid={true}
        showTooltip={true}
        showTotal={true}
        xAxisIsDate={true}
        customDateFormat="HH:mm"
        displayDateInUtc={false}
        updateDateRange={() => {}} // No-op for now
        className="w-full"
      />
    </div>
  )
}

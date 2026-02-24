'use client'

import { BarChart2, ExternalLink, LineChart } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Chart,
  ChartActions,
  ChartBar,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartTitle,
} from 'ui-patterns/Chart'

export default function ChartComposedActions() {
  const [isLoading, setIsLoading] = useState(true)
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

  const actions = [
    {
      label: 'Open in Logs Explorer',
      onClick: () => {
        alert('Opening in Logs Explorer...')
      },
      icon: <ExternalLink size={12} />,
    },
    {
      label: 'Toggle Chart Type',
      onClick: () => {
        setChartType(chartType === 'bar' ? 'line' : 'bar')
      },
      icon: chartType === 'bar' ? <LineChart size={12} /> : <BarChart2 size={12} />,
    },
  ]

  const data = Array.from({ length: 46 }, (_, i) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() - i * 5) // Each point 5 minutes apart

    return {
      timestamp: date.toISOString(),
      requests: Math.floor(Math.random() * 100),
    }
  }).reverse()

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <div className="flex flex-col gap-6 w-8/12">
      <Chart isLoading={isLoading}>
        <ChartCard>
          <ChartHeader>
            <ChartTitle tooltip="This is a tooltip">Total Requests</ChartTitle>
            <ChartActions actions={actions} />
          </ChartHeader>
          <ChartContent
            isEmpty={data.length === 0}
            emptyState={
              <ChartEmptyState
                icon={<BarChart2 size={16} />}
                title="No data to show"
                description="It may take up to 24 hours for data to refresh"
              />
            }
            loadingState={<ChartLoadingState />}
          >
            <div className="h-40">
              {chartType === 'bar' ? (
                <ChartBar
                  data={data}
                  dataKey="requests"
                  showGrid={false}
                  showYAxis={true}
                  YAxisProps={{
                    tickFormatter: (value) => `${value}k`,
                    width: 80,
                  }}
                  isFullHeight={true}
                />
              ) : (
                <ChartLine
                  data={data}
                  dataKey="requests"
                  showGrid={true}
                  showYAxis={true}
                  YAxisProps={{
                    tickFormatter: (value) => `${value}k`,
                    width: 80,
                  }}
                  isFullHeight={true}
                />
              )}
            </div>
          </ChartContent>
        </ChartCard>
      </Chart>
    </div>
  )
}

'use client'

import {
  Chart,
  ChartActions,
  ChartCard,
  ChartContent,
  ChartHeader,
  ChartTitle,
  ChartEmptyState,
  ChartLoadingState,
  ChartMetric,
  ChartFooter,
} from 'ui-patterns/Chart'
import { BarChart2, ExternalLink } from 'lucide-react'

import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import { useState, useEffect } from 'react'

export default function ComposedChartDemo() {
  const [isLoading, setIsLoading] = useState(true)

  const actions = [
    {
      label: 'Open in Logs Explorer',
      onClick: () => {
        alert('Ta da! You clicked me! 🎉')
      },
      icon: <ExternalLink size={12} />,
    },
  ]

  const data = Array.from({ length: 100 }, (_, i) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() - i * 5) // Each point 5 minutes apart

    return {
      timestamp: date.toISOString(),
      ok_count: Math.floor(Math.random() * 100), // Random value 0-99
      error_count: Math.floor(Math.random() * 50), // Random value 0-50
      warning_count: Math.floor(Math.random() * 50), // Random value 0-50
    }
  }).reverse()

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <div className="w-8/12">
      <Chart isLoading={isLoading}>
        <ChartCard>
          {/* <ChartHeader>
            <ChartTitle tooltip="This is a tooltip">My Chart Title</ChartTitle>

            <ChartActions actions={actions} />
          </ChartHeader> */}

          <ChartHeader>
            <ChartMetric label="Total Users" value="20000" />
            <div className="flex items-center gap-6">
              <ChartMetric label="Warn" value="12" status="warning" align="end" />
              <ChartMetric label="Err" value="7" status="negative" align="end" />
            </div>
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
              <LogsBarChart data={data} isFullHeight={true} />
            </div>
          </ChartContent>

          {/* <ChartFooter>Footer here, pass a table here etc.</ChartFooter> */}
        </ChartCard>
      </Chart>
    </div>
  )
}

'use client'

import { BarChart2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLoadingState,
  ChartMetric,
} from 'ui-patterns/Chart'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

export default function ComposedChartDemo() {
  const [isLoading, setIsLoading] = useState(true)

  const data = Array.from({ length: 60 }, (_, i) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() - i * 5) // Each point 5 minutes apart

    return {
      timestamp: date.toISOString(),
      ok_count: Math.floor(Math.random() * 100), // Random value 0-99
      error_count: Math.floor(Math.random() * 50), // Random value 0-50
      warning_count: Math.floor(Math.random() * 50), // Random value 0-50
    }
  }).reverse()

  const totalUsersValue = 4663

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <div className="w-8/12">
      <Chart isLoading={isLoading}>
        <ChartCard>
          <ChartHeader>
            <ChartMetric
              label="Total Users"
              value={totalUsersValue.toLocaleString('en-US')}
              tooltip="This is a tooltip"
            />
            <div className="flex items-center gap-6">
              <ChartMetric label="Warn" value="1.2k" status="warning" align="end" />
              <ChartMetric label="Err" value="736" status="negative" align="end" />
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
        </ChartCard>
      </Chart>
    </div>
  )
}

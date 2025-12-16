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
  ChartBar,
  ChartLine,
} from 'ui-patterns/Chart'
import { BarChart2, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ComposedChartBasic() {
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

  const data = Array.from({ length: 46 }, (_, i) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() - i * 5) // Each point 5 minutes apart

    return {
      timestamp: date.toISOString(),
      standard_score: Math.floor(Math.random() * 100),
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
            <ChartTitle tooltip="This is a tooltip">Standard Bar Chart</ChartTitle>

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
              <ChartBar
                data={data}
                dataKey="standard_score"
                showGrid={false}
                showYAxis={true}
                YAxisProps={{
                  tickFormatter: (value) => `${value}k`,
                  width: 80,
                }}
                isFullHeight={true}
              />
            </div>
          </ChartContent>
        </ChartCard>
      </Chart>

      <Chart isLoading={isLoading}>
        <ChartCard>
          <ChartHeader>
            <ChartTitle tooltip="This is a tooltip">Standard Line Chart</ChartTitle>

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
              <ChartLine
                data={data}
                dataKey="standard_score"
                showGrid={true}
                showYAxis={true}
                YAxisProps={{
                  tickFormatter: (value) => `${value}k`,
                  width: 80,
                }}
                isFullHeight={true}
              />
            </div>
          </ChartContent>
        </ChartCard>
      </Chart>
    </div>
  )
}

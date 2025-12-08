'use client'

import {
  Chart,
  ChartCard,
  ChartHeader,
  ChartActions,
  ChartContent,
  ChartMetric,
  ChartSparkline,
  ChartSparklineTooltip,
  ChartValueDifferential,
} from 'ui-patterns/Chart'
import { ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ChartComposedMetrics() {
  const [data, setData] = useState<Array<{ value: number; timestamp: string }>>([])

  const actions = [
    {
      label: 'Open in Logs Explorer',
      onClick: () => {
        alert('Ta da! You clicked me! 🎉')
      },
      icon: <ExternalLink size={12} />,
    },
  ]

  useEffect(() => {
    const now = new Date()
    setData(
      Array.from({ length: 12 }, (_, i) => ({
        value: Math.floor(4000 + i * 100 + (Math.random() * 2000 - 800)),
        timestamp: new Date(now.getTime() - (11 - i) * 60 * 60 * 1000).toISOString(),
      }))
    )
  }, [])

  const averageValue = data.reduce((acc, curr) => acc + curr.value, 0) / data.length

  const diff = data[data.length - 1]?.value - data[0]?.value || 0
  const diffPercentage = (diff / averageValue) * 100

  return (
    <div className="grid grid-cols-2 gap-6 w-full">
      <Chart isLoading={!data.length}>
        <ChartCard>
          <ChartHeader className="pb-4" align="start">
            <ChartMetric label="Slow Queries" value={0} />
            <ChartActions actions={actions} />
          </ChartHeader>
        </ChartCard>
      </Chart>
      <Chart isLoading={true}>
        <ChartCard>
          <ChartHeader align="start">
            <ChartMetric
              label="Active Users"
              value={averageValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              diffValue={diffPercentage.toFixed(2) + '%'}
            />
            <ChartActions actions={actions} />
          </ChartHeader>
          <ChartContent hasPadding={false}>
            <ChartSparkline data={data} dataKey="value" />
          </ChartContent>
        </ChartCard>
      </Chart>
    </div>
  )
}

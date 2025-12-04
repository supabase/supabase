'use client'

import {
  Chart,
  ChartActions,
  ChartCard,
  ChartContent,
  ChartHeader,
  ChartTitle,
} from 'ui-patterns/Chart'
import { ExternalLink } from 'lucide-react'

export default function ComposedChartDemo() {
  const actions = [
    {
      label: 'Open in Logs Explorer',
      onClick: () => {
        alert('Ta da! You clicked me! 🎉')
      },
      icon: <ExternalLink size={12} />,
    },
  ]

  return (
    <Chart>
      <ChartCard>
        <ChartHeader>
          <ChartTitle tooltip="This is a tooltip">My Chart Title</ChartTitle>
          <ChartActions actions={actions} />
        </ChartHeader>
        <ChartContent>Chart here</ChartContent>
      </ChartCard>
    </Chart>
  )
}

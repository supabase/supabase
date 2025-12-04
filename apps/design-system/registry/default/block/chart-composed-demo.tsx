'use client'

import { Chart, ChartActions, ChartCard, ChartHeader, ChartTitle } from 'ui-patterns/Chart'
import { ExternalLink } from 'lucide-react'

export default function ComposedChartDemo() {
  const actions = [
    {
      label: 'Open in Logs Explorer',
      onClick: () => {
        alert('Tada! You clicked me!')
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
      </ChartCard>
    </Chart>
  )
}

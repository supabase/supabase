'use client'

import {
  Chart,
  ChartActions,
  ChartCard,
  ChartContent,
  ChartHeader,
  ChartTitle,
  ChartEmptyState,
} from 'ui-patterns/Chart'
import { BarChart2, ExternalLink } from 'lucide-react'

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
    <div className="w-8/12">
      <Chart>
        <ChartCard>
          <ChartHeader>
            <ChartTitle tooltip="This is a tooltip">My Chart Title</ChartTitle>
            <ChartActions actions={actions} />
          </ChartHeader>
          <ChartContent
            isEmpty={true}
            emptyState={
              <ChartEmptyState
                icon={<BarChart2 size={16} />}
                title="No data to show"
                description="It may take up to 24 hours for data to refresh"
              />
            }
          >
            Chart here
          </ChartContent>
        </ChartCard>
      </Chart>
    </div>
  )
}

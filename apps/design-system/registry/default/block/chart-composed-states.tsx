'use client'

import { BarChart2, ExternalLink } from 'lucide-react'
import {
  Chart,
  ChartCard,
  ChartHeader,
  ChartTitle,
  ChartActions,
  ChartContent,
  ChartEmptyState,
  ChartLoadingState,
} from 'ui-patterns/Chart'

export default function ChartComposedStates() {
  const actions = [
    {
      label: 'Open in Logs Explorer',
      onClick: () => {
        alert('Ta da! You clicked me! 🎉')
      },
      icon: <ExternalLink size={12} />,
    },
  ]

  const disabledActions = [
    {
      label: 'Upgrade to Pro',
      href: '/pro',
    },
  ]

  return (
    <div className="flex flex-col gap-6 w-8/12">
      <Chart isLoading={true}>
        <ChartCard>
          <ChartHeader>
            <ChartTitle tooltip="This is a tooltip">Response Errors</ChartTitle>
            <ChartActions actions={actions} />
          </ChartHeader>
          <ChartContent loadingState={<ChartLoadingState />}>My chart here...</ChartContent>
        </ChartCard>
      </Chart>

      <Chart>
        <ChartCard>
          <ChartHeader>
            <ChartTitle tooltip="This is a tooltip">Response Errors</ChartTitle>
            <ChartActions actions={actions} />
          </ChartHeader>
          <ChartContent
            isEmpty={true}
            emptyState={
              <ChartEmptyState
                icon={<BarChart2 size={20} />}
                title="No data to show"
                description="It may take up to 24 hours for data to refresh"
              />
            }
            loadingState={<ChartLoadingState />}
          >
            My chart here...
          </ChartContent>
        </ChartCard>
      </Chart>

      <Chart isDisabled={true}>
        <ChartCard>
          <ChartHeader>
            <ChartTitle tooltip="This is a tooltip">Response Errors</ChartTitle>
            <ChartActions actions={actions} />
          </ChartHeader>
          <ChartContent loadingState={<ChartLoadingState />} disabledActions={disabledActions}>
            My chart here...
          </ChartContent>
        </ChartCard>
      </Chart>
    </div>
  )
}

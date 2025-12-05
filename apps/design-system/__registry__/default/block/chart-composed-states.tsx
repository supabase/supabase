'use client'

import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Chart, ChartCard, ChartHeader, ChartTitle, ChartActions } from 'ui-patterns/Chart'

export default function ChartComposedStates() {
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

  // useEffect(() => {
  //   setTimeout(() => {
  //     setIsLoading(false)
  //   }, 1000)
  // }, [])

  return (
    <div className="flex flex-col gap-6 w-8/12">
      <Chart isLoading={isLoading}>
        <ChartCard>
          <ChartHeader>
            <ChartTitle tooltip="This is a tooltip">My Chart Title</ChartTitle>

            <ChartActions actions={actions} />
          </ChartHeader>
        </ChartCard>
      </Chart>
    </div>
  )
}

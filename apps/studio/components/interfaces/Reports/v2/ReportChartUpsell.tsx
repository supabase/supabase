import Link from 'next/link'
import { useRef, useState } from 'react'

import { LogChartHandler } from 'components/ui/Charts/LogChartHandler'
import { ReportConfig } from 'data/reports/v2/reports.types'
import { Button, Card, cn } from 'ui'

export function ReportChartUpsell({
  report,
  orgSlug,
}: {
  report: {
    label: string
    availableIn: string[]
  }
  orgSlug: string
}) {
  const [isHoveringUpgrade, setIsHoveringUpgrade] = useState(false)

  const startDate = '2025-01-01'
  const endDate = '2025-01-02'

  const getExpDemoChartData = () =>
    new Array(20).fill(0).map((_, index) => ({
      period_start: new Date(startDate).getTime() + index * 1000,
      demo: Math.floor(Math.pow(1.25, index) * 10),
      max_demo: 1000,
    }))

  const getDemoChartData = () =>
    new Array(20).fill(0).map((_, index) => ({
      period_start: new Date(startDate).getTime() + index * 1000,
      demo: Math.floor(Math.random() * 10) + 1,
      max_demo: 1000,
    }))

  const demoChartData = useRef(getDemoChartData())
  const exponentialChartData = useRef(getExpDemoChartData())

  const demoData = isHoveringUpgrade ? exponentialChartData.current : demoChartData.current

  return (
    <Card className={cn('h-[260px] relative')}>
      <div className="z-10 flex flex-col items-center justify-center space-y-2 h-full absolute top-0 left-0 w-full bg-surface-100/70 backdrop-blur-md">
        <h2 className="text-sm">{report.label}</h2>
        <p className="text-sm text-foreground-light">
          This chart is available from{' '}
          <span className="capitalize">
            {!!report.availableIn?.length ? report.availableIn[0] : 'Pro'}
          </span>{' '}
          plan and above
        </p>
        <Button
          asChild
          type="primary"
          onMouseEnter={() => setIsHoveringUpgrade(true)}
          onMouseLeave={() => setIsHoveringUpgrade(false)}
          className="mt-4"
        >
          <Link href={`/org/${orgSlug}/billing?panel=subscriptionPlan&source=reports`}>
            Upgrade to{' '}
            <span className="capitalize">
              {!!report.availableIn?.length ? report.availableIn[0] : 'Pro'}
            </span>
          </Link>
        </Button>
      </div>
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <LogChartHandler
          attributes={[
            {
              attribute: 'demo',
              enabled: true,
              label: 'Demo',
              provider: 'logs',
            },
          ]}
          label={''}
          startDate={startDate}
          endDate={endDate}
          interval={'1d'}
          data={demoData as any}
          isLoading={false}
          highlightedValue={0}
          updateDateRange={() => {}}
        />
      </div>
    </Card>
  )
}

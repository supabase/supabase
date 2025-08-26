import Panel from 'components/ui/Panel'
import { Button, cn } from 'ui'
import { Report } from 'data/reports/v2/edge-functions.config'
import { useRef, useState } from 'react'
import { AnalyticsInterval } from 'data/analytics/constants'
import Link from 'next/link'

export function ReportChartUpsell({
  report,
  startDate,
  endDate,
  interval,
  orgSlug,
}: {
  report: Report
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  orgSlug: string
}) {
  const [isHoveringUpgrade, setIsHoveringUpgrade] = useState(false)

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
    <Panel title={<p className="text-sm">{report.label}</p>} className={cn('h-[260px] relative')}>
      <div className="z-10 flex flex-col items-center justify-center space-y-2 h-full absolute top-0 left-0 w-full bg-surface-100/70 backdrop-blur-md">
        <h2>{report.label}</h2>
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
        >
          <Link href={`/org/${orgSlug}/billing?panel=subscriptionPlan&source=reports`}>
            Upgrade to{' '}
            <span className="capitalize">
              {!!report.availableIn?.length ? report.availableIn[0] : 'Pro'}
            </span>
          </Link>
        </Button>
      </div>
      <div className="absolute top-0 left-0 w-full h-full z-0"></div>
    </Panel>
  )
}

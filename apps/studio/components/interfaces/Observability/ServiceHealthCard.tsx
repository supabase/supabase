import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import Link from 'next/link'
import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle, cn, Loading } from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import { getHealthStatus, type ServiceKey } from './ObservabilityOverview.utils'

const colorClassMap: Record<string, string> = {
  muted: 'bg-muted',
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  brand: 'bg-brand',
}

export type ServiceHealthCardProps = {
  serviceName: string
  serviceKey: ServiceKey
  total: number
  errorRate: number
  errorCount: number
  warningCount: number
  chartData: LogsBarChartDatum[]
  reportUrl?: string // undefined if feature flag disabled or no report available
  logsUrl: string
  isLoading: boolean
  onBarClick: (datum: any) => void
  datetimeFormat: string
}

export const ServiceHealthCard = ({
  serviceName,
  serviceKey,
  total,
  errorRate,
  errorCount,
  warningCount,
  chartData,
  reportUrl,
  logsUrl,
  isLoading,
  onBarClick,
  datetimeFormat,
}: ServiceHealthCardProps) => {
  const { status, color } = getHealthStatus(errorRate, total)

  return (
    <Card className="mb-0 md:mb-0 h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-0 border-b-0">
        <div className="flex flex-col">
          <CardTitle className="text-foreground-light flex items-center gap-2 text-xs font-medium">
            <div className={cn('w-1.5 h-1.5 rounded-full', colorClassMap[color] || 'bg-muted')} />
            {serviceName}
          </CardTitle>
          <div className="flex items-start gap-6 mt-2">
            <div className="flex flex-col">
              <span className="text-foreground text-xl">{total.toLocaleString()}</span>
              <span className="text-foreground-light text-xs">requests</span>
            </div>
            <div className="flex flex-col">
              <span className="text-foreground text-xl">{errorRate.toFixed(1)}%</span>
              <span className="text-foreground-light text-xs">error rate</span>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-4 text-foreground-light">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-warning rounded-full" />
              <span className="heading-meta">Warn</span>
            </div>
            <span className="text-foreground text-xl">{warningCount.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
              <span className="heading-meta">Err</span>
            </div>
            <span className="text-foreground text-xl">{errorCount.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-card pt-4 flex-1 overflow-hidden max-h-[200px]">
        <Loading isFullHeight active={isLoading}>
          <LogsBarChart
            isFullHeight
            data={chartData}
            DateTimeFormat={datetimeFormat}
            onBarClick={onBarClick}
            EmptyState={
              <NoDataPlaceholder size="small" message="No data for selected period" isFullHeight />
            }
          />
        </Loading>
      </CardContent>

      <CardFooter className="border-t pt-3 pb-4 px-card flex gap-2">
        {reportUrl && (
          <Button type="default" size="tiny" asChild className="flex-1">
            <Link href={reportUrl}>View Report</Link>
          </Button>
        )}
        <Button type="default" size="tiny" asChild className="flex-1">
          <Link href={logsUrl}>View Logs</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

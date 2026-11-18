import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { WarehouseIcon } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ChartLine } from 'ui-patterns/Chart'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import { AlertError } from '@/components/ui/AlertError'
import NoDataPlaceholder from '@/components/ui/Charts/NoDataPlaceholder'
import { InlineLink } from '@/components/ui/InlineLink'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useIsWarehouseEnabled } from '@/hooks/misc/useIsWarehouseEnabled'
import { IS_PLATFORM } from '@/lib/constants'

export const WarehouseMetricsReport = () => {
  const isWarehouseEnabled = useIsWarehouseEnabled()
  if (!isWarehouseEnabled)
    return (
      <>
        <ReportHeader title="Warehouse" showDatabaseSelector={false} />
        <Admonition layout="responsive" title="Warehouse metrics are unavailable" />
      </>
    )
  return <WarehouseMetricsReportContent />
}

const WarehouseMetricsReportContent = () => {
  const { ref } = useParams()
  const [range] = useState(() => {
    const end = dayjs().startOf('minute')
    return { startDate: end.subtract(1, 'hour').toISOString(), endDate: end.toISOString() }
  })
  const setup = useWarehouseSetupStatusQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const query = useQuery(
    warehouseMetricsQueryOptions({
      projectRef: ref,
      attributes: ['query_rate'],
      ...range,
      interval: '1m',
    })
  )
  const metric = query.data?.metrics.find((item) => item.metric === 'query_rate')
  const hasLiveTables = setup.data?.tables.some((table) => table.state === 'live') ?? false
  const isNotSetUp = setup.data?.setup_status === 'not_started' && !hasLiveTables
  const isDisabled = setup.data?.setup_status === 'disabled' && !hasLiveTables
  const hasValues =
    metric?.series.some((series) =>
      series.points.some((point) => point.value !== null && Number.isFinite(point.value))
    ) ?? false
  const canShowSetup = !hasValues && (isNotSetUp || isDisabled)
  const points =
    metric?.series.length === 1
      ? metric.series[0].points.map((point): Record<string, string | number> => {
          const row: Record<string, string | number> = {
            timestamp: new Date(point.timestamp * 1000).toISOString(),
          }
          if (point.value !== null && Number.isFinite(point.value)) row.value = point.value
          return row
        })
      : []
  const emptyMessage = (() => {
    if (!metric || metric.series.length > 1) return 'Metrics are temporarily unavailable'
    switch (metric.availability) {
      case 'stale':
        return 'No recent data'
      case 'insufficient_data':
        return 'Not enough data yet'
      case 'unavailable':
      case 'disabled':
      case 'not_provisioned':
        return 'Metrics are temporarily unavailable'
      default:
        return 'No data in the last 60 minutes'
    }
  })()
  const hasChartValues = points.some((point) => typeof point.value === 'number')

  const reportStatus = (() => {
    if (!IS_PLATFORM) return 'Warehouse metrics are unavailable'
    if (query.isPending || (setup.isPending && !hasValues)) return 'Loading Warehouse report'
    if (setup.isError && !hasValues) return 'Could not load Warehouse setup status'
    if (canShowSetup) return isDisabled ? 'Warehouse is disabled' : 'Warehouse is not set up'
    if (query.isError) return 'Could not load Warehouse metrics'
    return hasChartValues ? 'Warehouse report loaded' : `Warehouse report: ${emptyMessage}`
  })()

  const renderContent = () => {
    if (!IS_PLATFORM)
      return (
        <Admonition
          layout="responsive"
          title="Warehouse metrics are unavailable"
          description="Warehouse metrics are only available on the Supabase platform."
        />
      )
    if (query.isPending || (setup.isPending && !hasValues))
      return <GenericSkeletonLoader aria-label="Loading Warehouse report" />
    if (setup.isError && !hasValues)
      return (
        <AlertError
          projectRef={ref}
          error={setup.error}
          subject="Failed to retrieve Warehouse status"
        />
      )
    if (canShowSetup)
      return (
        <EmptyStatePresentational
          icon={WarehouseIcon}
          title={isDisabled ? 'Warehouse is disabled' : 'Warehouse is not set up'}
          description={
            isDisabled
              ? 'Set up Warehouse again to query a replicated copy of your data and monitor its latency, failures, and capacity here.'
              : 'Run analytical queries on a replicated copy of your data, then monitor query latency, failures, and capacity here.'
          }
        >
          <Button asChild variant="default">
            <InlineLink
              className="no-underline"
              href={`/project/${ref}/integrations/warehouse/overview`}
            >
              Set up Warehouse
            </InlineLink>
          </Button>
        </EmptyStatePresentational>
      )
    if (query.isError)
      return (
        <AlertError
          projectRef={ref}
          error={query.error}
          subject="Failed to retrieve Warehouse metrics"
        />
      )
    return (
      <Card>
        <CardContent className="space-y-4 p-4">
          {hasChartValues ? (
            <>
              <h2 className="text-sm">Query rate</h2>
              <p className="text-xs text-foreground-light">
                Queries started per second. Not a count of SQL statements.
              </p>
              <ChartLine
                className="h-64"
                isFullHeight
                data={points}
                xKey="timestamp"
                dataKey="value"
                config={{ value: { label: 'Queries/s', color: 'var(--chart-1)' } }}
                color="var(--chart-1)"
                DateTimeFormat="MMM D, HH:mm"
                showHighlightArea={false}
                tooltipDetails={(_, __, value) => `${value}/s`}
              />
            </>
          ) : (
            <NoDataPlaceholder
              attribute="Query rate"
              size="normal"
              hideTotalPlaceholder
              message={emptyMessage}
            />
          )}
          {hasChartValues && metric?.availability === 'partial' && (
            <p className="text-xs text-foreground-light">Partial data</p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <ReportHeader title="Warehouse" showDatabaseSelector={false} />
      <p className="text-sm text-foreground-light">Query activity in the last 60 minutes.</p>
      <div className="relative">
        <p role="status" className="sr-only">
          {reportStatus}
        </p>
        {renderContent()}
      </div>
    </>
  )
}

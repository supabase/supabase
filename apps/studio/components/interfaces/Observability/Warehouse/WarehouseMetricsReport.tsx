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

import {
  getEmptyMessage,
  getReportStatus,
  getReportView,
  getSetupPrompt,
  hasAnyValues,
  toChartPoints,
  type ReportView,
} from './WarehouseMetricsReport.utils'
import { ReportHeader } from '@/components/interfaces/Reports/ReportHeader'
import { AlertError } from '@/components/ui/AlertError'
import { NoDataPlaceholder } from '@/components/ui/Charts/NoDataPlaceholder'
import { InlineLink } from '@/components/ui/InlineLink'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useIsWarehouseEnabled } from '@/hooks/misc/useIsWarehouseEnabled'
import { IS_PLATFORM } from '@/lib/constants'

export const WarehouseMetricsReport = () => {
  const isWarehouseEnabled = useIsWarehouseEnabled()

  return (
    <>
      <ReportHeader title="Warehouse" showDatabaseSelector={false} />
      {!isWarehouseEnabled ? (
        <Admonition layout="responsive" title="Warehouse metrics are unavailable" />
      ) : (
        <WarehouseMetricsReportContent />
      )}
    </>
  )
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
  const hasValues = hasAnyValues(metric)
  const points = toChartPoints(metric)
  const hasChartValues = points.some((point) => typeof point.value === 'number')
  const emptyMessage = getEmptyMessage(metric)

  const view = getReportView({
    isPlatform: IS_PLATFORM,
    isLoading: query.isPending || (setup.isPending && !hasValues),
    setupError: setup.isError && !hasValues ? setup.error : null,
    setupPrompt: getSetupPrompt({
      setupStatus: setup.data?.setup_status,
      hasLiveTables,
      hasValues,
    }),
    metricsError: query.isError ? query.error : null,
    hasChartValues,
  })

  return (
    <>
      <p className="text-sm text-foreground-light">Query activity in the last 60 minutes.</p>
      <div className="relative">
        <p role="status" className="sr-only">
          {getReportStatus(view, emptyMessage)}
        </p>
        <WarehouseMetricsBody
          view={view}
          projectRef={ref}
          points={points}
          emptyMessage={emptyMessage}
          isPartial={metric?.availability === 'partial'}
        />
      </div>
    </>
  )
}

const WarehouseMetricsBody = ({
  view,
  projectRef,
  points,
  emptyMessage,
  isPartial,
}: {
  view: ReportView
  projectRef?: string
  points: Record<string, string | number>[]
  emptyMessage: string
  isPartial: boolean
}) => {
  switch (view.kind) {
    case 'unsupported':
      return (
        <Admonition
          layout="responsive"
          title="Warehouse metrics are unavailable"
          description="Warehouse metrics are only available on the Supabase platform."
        />
      )
    case 'loading':
      return <GenericSkeletonLoader aria-label="Loading Warehouse report" />
    case 'setup-error':
      return (
        <AlertError
          projectRef={projectRef}
          error={view.error}
          subject="Failed to retrieve Warehouse status"
        />
      )
    case 'setup': {
      const isDisabled = view.prompt === 'disabled'
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
              href={`/project/${projectRef}/integrations/warehouse/overview`}
            >
              Set up Warehouse
            </InlineLink>
          </Button>
        </EmptyStatePresentational>
      )
    }
    case 'metrics-error':
      return (
        <AlertError
          projectRef={projectRef}
          error={view.error}
          subject="Failed to retrieve Warehouse metrics"
        />
      )
    case 'ready':
      return (
        <Card>
          <CardContent className="space-y-4 p-4">
            {view.hasChartValues ? (
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
            {view.hasChartValues && isPartial && (
              <p className="text-xs text-foreground-light">Partial data</p>
            )}
          </CardContent>
        </Card>
      )
  }
}

import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { RefreshCwIcon, WarehouseIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseCapacitySection } from './WarehouseCapacitySection'
import { WarehouseLatencySection } from './WarehouseLatencySection'
import { WarehouseMetricChart } from './WarehouseMetricChart'
import { resolveWarehouseMetricsRange } from './WarehouseMetrics.range'
import {
  getEmptyMessage,
  getReportStatus,
  getReportView,
  getSetupPrompt,
  hasAnyValues,
  type ReportView,
} from './WarehouseMetricsReport.utils'
import { WarehouseWorkersSection } from './WarehouseWorkersSection'
import { ReportHeader } from '@/components/interfaces/Reports/ReportHeader'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import ReportStickyNav from '@/components/interfaces/Reports/ReportStickyNav'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { warehouseKeys } from '@/data/warehouse/keys'
import { type WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'
import type { WarehouseMetricsData } from '@/data/warehouse/warehouse-metrics-query'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useIsWarehouseEnabled } from '@/hooks/misc/useIsWarehouseEnabled'
import { useRefreshHandler, useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const WAREHOUSE_METRICS: {
  metric: WarehouseMetricName
  title: string
  unit?: '/s' | 'ms'
  description: string
}[] = [
  {
    metric: 'query_rate',
    title: 'Query rate',
    unit: '/s',
    description: 'Queries started per second. Not a count of SQL statements.',
  },
  {
    metric: 'query_in_flight',
    title: 'Queries in progress',
    unit: undefined,
    description: 'Queries awaiting completion, including worker waits and result streaming.',
  },
  {
    metric: 'query_error_rate',
    title: 'Query errors',
    unit: '/s',
    description:
      'Failed queries per second, including timeouts. Canceled queries are counted separately.',
  },
  {
    metric: 'query_timeout_rate',
    title: 'Timeouts (included in errors)',
    unit: '/s',
    description: 'Timed-out queries per second. These are already included in query errors.',
  },
  {
    metric: 'query_canceled_rate',
    title: 'Canceled queries',
    unit: '/s',
    description: 'Canceled queries per second, counted separately from errors.',
  },
]

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
  const queryClient = useQueryClient()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const {
    selectedDateRange,
    datePickerValue,
    datePickerHelpers,
    handleDatePickerChange,
    showUpgradePrompt,
    setShowUpgradePrompt,
  } = useReportDateRange()
  const range = resolveWarehouseMetricsRange({
    start: selectedDateRange.period_start.date,
    end: selectedDateRange.period_end.date,
  })
  const isRangeOk = range.status === 'ok'
  const setup = useWarehouseSetupStatusQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const query = useQuery(
    warehouseMetricsQueryOptions({
      projectRef: ref,
      attributes: WAREHOUSE_METRICS.map((x) => x.metric),
      startDate: isRangeOk ? range.startDate : '',
      endDate: isRangeOk ? range.endDate : '',
      interval: isRangeOk ? range.interval : '1m',
      enabled: isRangeOk,
    })
  )
  const isFetching = useIsFetching({ queryKey: warehouseKeys.metrics(ref) }) > 0

  const handleRefresh = useRefreshHandler(
    datePickerValue,
    datePickerHelpers,
    handleDatePickerChange,
    async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: warehouseKeys.metrics(ref) }),
        queryClient.invalidateQueries({ queryKey: warehouseKeys.setupStatus(ref) }),
      ])
    }
  )
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_REFRESH, handleRefresh, { enabled: !isFetching })
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER, () => {
    setShowDatePicker((open) => !open)
  })

  const metric = query.data?.metrics.find((item) => item.metric === 'query_rate')
  const hasLiveTables = setup.data?.tables.some((table) => table.state === 'live') ?? false
  const hasValues = query.data?.metrics.some(hasAnyValues) ?? false
  const hasChartValues = hasValues
  const emptyMessage = getEmptyMessage(metric)

  const view = getReportView({
    isPlatform: IS_PLATFORM,
    isRangeValid: isRangeOk,
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

  const handleResetRange = () => {
    const helper = datePickerHelpers.find(
      (item) => item.text === REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES
    )
    if (!helper) return
    handleDatePickerChange({
      from: helper.calcFrom(),
      to: helper.calcTo(),
      isHelper: true,
      text: helper.text,
    })
  }

  return (
    <>
      <ReportStickyNav
        content={
          <div className="flex flex-wrap items-center gap-2">
            <ShortcutTooltip shortcutId={SHORTCUT_IDS.OBSERVABILITY_REFRESH} label="Refresh report">
              <Button
                type="button"
                aria-label="Refresh report"
                disabled={isFetching}
                icon={<RefreshCwIcon className={isFetching ? 'motion-safe:animate-spin' : ''} />}
                onClick={handleRefresh}
              />
            </ShortcutTooltip>
            <LogsDatePicker
              value={datePickerValue}
              helpers={datePickerHelpers}
              onSubmit={handleDatePickerChange}
              open={showDatePicker}
              onOpenChange={setShowDatePicker}
              shortcutId={SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER}
            />
            <p className="text-xs text-foreground-light">
              {dayjs(selectedDateRange.period_start.date).format('MMM D, h:mma')} to{' '}
              {dayjs(selectedDateRange.period_end.date).format('MMM D, h:mma')}
            </p>
          </div>
        }
      >
        <div role="status">
          {isRangeOk && range.isClamped && (
            <p className="text-sm text-foreground-light">
              The selected period was adjusted to fit the available metrics window.
            </p>
          )}
        </div>
        <div className="relative">
          <p role="status" aria-label="Report status" className="sr-only">
            {getReportStatus(view, emptyMessage)}
          </p>
          <WarehouseMetricsBody
            view={view}
            projectRef={ref}
            data={query.data}
            onResetRange={handleResetRange}
          />
          {view.kind === 'ready' && range.status === 'ok' && (
            <div className="flex flex-col gap-y-8 mt-8">
              <WarehouseLatencySection range={range} />
              <WarehouseCapacitySection range={range} />
              <WarehouseWorkersSection range={range} />
            </div>
          )}
        </div>
      </ReportStickyNav>
      <UpgradePrompt
        show={showUpgradePrompt}
        setShowUpgradePrompt={setShowUpgradePrompt}
        title="Report date range"
        description="Warehouse metrics follow your organization's log retention limits, up to 30 days."
        source="warehouseReportDateRange"
      />
    </>
  )
}

const WarehouseMetricsBody = ({
  view,
  projectRef,
  data,
  onResetRange,
}: {
  view: ReportView
  projectRef?: string
  data?: WarehouseMetricsData
  onResetRange: () => void
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
    case 'out-of-range':
      return (
        <Admonition
          layout="responsive"
          title="This period is outside the available metrics history"
          description="Warehouse metrics cover the last 30 days. Choose a more recent period."
          actions={<Button onClick={onResetRange}>Show last 60 minutes</Button>}
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
        <div className="grid gap-4 md:grid-cols-2">
          {WAREHOUSE_METRICS.map((chart) => (
            <WarehouseMetricChart
              key={chart.metric}
              metric={data?.metrics.find((item) => item.metric === chart.metric)}
              title={chart.title}
              description={chart.description}
              unit={chart.unit}
            />
          ))}
        </div>
      )
  }
}

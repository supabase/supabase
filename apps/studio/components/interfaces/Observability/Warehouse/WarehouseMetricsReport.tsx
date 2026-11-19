import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { RefreshCwIcon, WarehouseIcon } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ChartLine } from 'ui-patterns/Chart'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { resolveWarehouseMetricsRange } from './WarehouseMetrics.range'
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
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import ReportStickyNav from '@/components/interfaces/Reports/ReportStickyNav'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import { AlertError } from '@/components/ui/AlertError'
import { NoDataPlaceholder } from '@/components/ui/Charts/NoDataPlaceholder'
import { InlineLink } from '@/components/ui/InlineLink'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { warehouseKeys } from '@/data/warehouse/keys'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useIsWarehouseEnabled } from '@/hooks/misc/useIsWarehouseEnabled'
import { useRefreshHandler, useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

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
      attributes: ['query_rate'],
      startDate: isRangeOk ? range.startDate : '',
      endDate: isRangeOk ? range.endDate : '',
      interval: isRangeOk ? range.interval : '1m',
      enabled: isRangeOk,
    })
  )
  const handleRefresh = useRefreshHandler(
    datePickerValue,
    datePickerHelpers,
    handleDatePickerChange,
    async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: warehouseKeys.metricsAll(ref) }),
        queryClient.invalidateQueries({ queryKey: warehouseKeys.setupStatus(ref) }),
      ])
    }
  )
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_REFRESH, handleRefresh, { enabled: !query.isFetching })
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER, () => {
    setShowDatePicker((open) => !open)
  })
  const metric = query.data?.metrics.find((item) => item.metric === 'query_rate')
  const hasLiveTables = setup.data?.tables.some((table) => table.state === 'live') ?? false
  const hasValues = hasAnyValues(metric)
  const points = toChartPoints(metric)
  const hasChartValues = points.some((point) => typeof point.value === 'number')
  const emptyMessage = getEmptyMessage(metric, 'No data in the selected period')

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
                disabled={query.isFetching}
                icon={
                  <RefreshCwIcon className={query.isFetching ? 'motion-safe:animate-spin' : ''} />
                }
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
            points={points}
            emptyMessage={emptyMessage}
            isPartial={metric?.availability === 'partial'}
            onResetRange={handleResetRange}
          />
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
  points,
  emptyMessage,
  isPartial,
  onResetRange,
}: {
  view: ReportView
  projectRef?: string
  points: Record<string, string | number>[]
  emptyMessage: string
  isPartial: boolean
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

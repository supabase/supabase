import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRightIcon, EllipsisIcon, RefreshCwIcon } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  getSectionAttributes,
  WAREHOUSE_METRICS_MAX_RANGE_DAYS,
  WAREHOUSE_METRICS_SECTIONS,
} from './WarehouseMetrics.constants'
import {
  getWarehouseMetricsPageState,
  resolveWarehouseMetricsRange,
} from './WarehouseMetrics.utils'
import { WarehouseMetricsEmptyState } from './WarehouseMetricsEmptyState'
import { WarehouseMetricsSection } from './WarehouseMetricsSection'
import { OBSERVABILITY_DOCS_HREFS } from '@/components/interfaces/Observability/Observability.constants'
import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import ReportStickyNav from '@/components/interfaces/Reports/ReportStickyNav'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { warehouseKeys } from '@/data/warehouse/keys'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'
import { useRefreshHandler, useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { IS_PLATFORM } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const REPORT_TITLE = 'Warehouse'

export const WarehouseMetricsReport = () => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const [isDemoRequested] = useQueryState('warehouseMetricsDemo', parseAsBoolean.withDefault(false))
  const isDemo = process.env.NODE_ENV === 'development' && isDemoRequested
  const setup = useWarehouseSetupStatusQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const hasLiveTables = setup.data?.tables.some((table) => table.state === 'live') ?? false
  const isNotSetUp = setup.data?.setup_status === 'not_started' && !hasLiveTables
  const isDisabled = setup.data?.setup_status === 'disabled' && !hasLiveTables
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const {
    selectedDateRange,
    updateDateRange,
    datePickerValue,
    datePickerHelpers,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES, {
    retentionDays: WAREHOUSE_METRICS_MAX_RANGE_DAYS,
  })

  // Out-of-range bounds are rewritten and in-range ones pass through unchanged,
  // so the query keys stay stable across renders.
  const range = resolveWarehouseMetricsRange({
    start: selectedDateRange.period_start.date,
    end: selectedDateRange.period_end.date,
  })
  const isRangeOk = range.status === 'ok'

  const results = useQueries({
    queries: WAREHOUSE_METRICS_SECTIONS.map((section) => ({
      ...warehouseMetricsQueryOptions({
        projectRef: ref,
        isDemo,
        attributes: getSectionAttributes(section),
        startDate: isRangeOk ? range.startDate : '',
        endDate: isRangeOk ? range.endDate : '',
        interval: isRangeOk ? range.interval : '1h',
      }),
      enabled: IS_PLATFORM && !!ref && isRangeOk,
    })),
  })

  const onRefreshReport = useRefreshHandler(
    datePickerValue,
    datePickerHelpers,
    handleDatePickerChange,
    async () => {
      setIsRefreshing(true)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: warehouseKeys.setupStatus(ref) }),
        queryClient.invalidateQueries({ queryKey: warehouseKeys.metricsAll(ref) }),
      ])
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  )

  useShortcut(SHORTCUT_IDS.OBSERVABILITY_REFRESH, onRefreshReport, { enabled: !isRefreshing })
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER, () => {
    setShowDatePicker((open) => !open)
  })

  const resetToLastHour = () => {
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

  const pageState = getWarehouseMetricsPageState(results)
  const hasReportMetrics = results.some(
    (result) =>
      result.isSuccess &&
      result.data.metrics.some(
        (metric) => metric.availability !== 'not_provisioned' && metric.availability !== 'disabled'
      )
  )
  const syncId = `warehouse-${ref}`
  const loadingState = (
    <Card aria-label="Loading Warehouse report" aria-busy="true">
      <CardContent className="py-8">
        <GenericSkeletonLoader />
      </CardContent>
    </Card>
  )

  const renderContent = () => {
    if (!IS_PLATFORM) {
      return (
        <Admonition
          type="note"
          title="Warehouse metrics aren't available here"
          description="Supabase Warehouse metrics are only available for projects on the Supabase platform."
        />
      )
    }

    if (range.status === 'out_of_range') {
      return (
        <Admonition
          type="note"
          title="Supabase Warehouse metrics cover the last 30 days"
          description="Choose a date range within the last 30 days to see metrics."
          actions={
            <Button variant="default" onClick={resetToLastHour}>
              Show last 60 minutes
            </Button>
          }
        />
      )
    }

    if (!isDemo && (isNotSetUp || isDisabled)) {
      if (setup.isFetching) return loadingState
      return (
        <WarehouseMetricsEmptyState
          projectRef={ref}
          status={isDisabled ? 'disabled' : 'not_provisioned'}
        />
      )
    }

    // Metrics can still be read when replication status is unavailable.
    if (!setup.data && !hasReportMetrics) {
      if (setup.isPending || results.some((result) => result.isPending)) {
        return loadingState
      }
      if (setup.isError) {
        return (
          <AlertError
            projectRef={ref}
            subject="Failed to check Warehouse status"
            error={setup.error}
            additionalActions={
              <Button variant="default" loading={setup.isFetching} onClick={() => setup.refetch()}>
                Retry
              </Button>
            }
          />
        )
      }
    }

    if (pageState.status === 'not_provisioned' || pageState.status === 'disabled') {
      return <WarehouseMetricsEmptyState projectRef={ref} status="unavailable" />
    }

    if (pageState.status === 'all_failed') {
      return (
        <AlertError
          projectRef={ref}
          error={pageState.error}
          subject="Failed to retrieve Warehouse metrics"
        />
      )
    }

    return (
      <>
        {range.isClamped && (
          <p className="text-sm text-foreground-light">
            This range was adjusted to the last 30 days of available metrics.
          </p>
        )}
        {WAREHOUSE_METRICS_SECTIONS.map((section, index) => (
          <WarehouseMetricsSection
            key={section.id}
            section={section}
            query={results[index]}
            projectRef={ref}
            syncId={syncId}
            updateDateRange={updateDateRange}
          />
        ))}
      </>
    )
  }

  return (
    <>
      <ReportHeader showDatabaseSelector={false} title={REPORT_TITLE} />
      <ReportStickyNav
        content={
          <div className="flex w-full flex-wrap items-center gap-2">
            <ShortcutTooltip
              shortcutId={SHORTCUT_IDS.OBSERVABILITY_REFRESH}
              label="Refresh report"
              side="bottom"
            >
              <Button
                aria-label="Refresh report"
                disabled={isRefreshing}
                icon={<RefreshCwIcon className={isRefreshing ? 'animate-spin' : ''} />}
                className="w-7"
                onClick={onRefreshReport}
              />
            </ShortcutTooltip>
            <LogsDatePicker
              onSubmit={handleDatePickerChange}
              value={datePickerValue}
              helpers={datePickerHelpers}
              retentionDays={WAREHOUSE_METRICS_MAX_RANGE_DAYS}
              open={showDatePicker}
              onOpenChange={setShowDatePicker}
              shortcutId={SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER}
            />
            <div className="order-last flex w-full flex-wrap items-center gap-x-2 text-xs text-foreground-light xl:order-none xl:w-auto">
              <p>{dayjs(selectedDateRange.period_start.date).format('MMM D, h:mma')}</p>
              <ArrowRightIcon size={12} />
              <p>{dayjs(selectedDateRange.period_end.date).format('MMM D, h:mma')}</p>
            </div>
            <div
              className="ml-auto flex shrink-0 items-center gap-2"
              role="group"
              aria-label="Warehouse report actions"
            >
              <DocsButton href={OBSERVABILITY_DOCS_HREFS.warehouse} topic="Warehouse reports" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label="More actions"
                    className="shrink-0 px-2"
                    icon={<EllipsisIcon size={14} />}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <InlineLink
                      className="no-underline"
                      href={`/project/${ref}/integrations/warehouse/overview${isDemo ? '?warehouseMetricsDemo=true' : ''}`}
                    >
                      View Warehouse
                    </InlineLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        }
      >
        {renderContent()}
      </ReportStickyNav>
    </>
  )
}

import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'ui'

import { OBSERVABILITY_DOCS_HREFS } from '@/components/interfaces/Observability/Observability.constants'
import ReportFilterBar from '@/components/interfaces/Reports/ReportFilterBar'
import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import ReportPadding from '@/components/interfaces/Reports/ReportPadding'
import { REPORT_DATERANGE_HELPER_LABELS } from '@/components/interfaces/Reports/Reports.constants'
import ReportStickyNav from '@/components/interfaces/Reports/ReportStickyNav'
import { SharedAPIReport } from '@/components/interfaces/Reports/SharedAPIReport/SharedAPIReport'
import { useSharedAPIReport } from '@/components/interfaces/Reports/SharedAPIReport/SharedAPIReport.constants'
import { ReportChartV2 } from '@/components/interfaces/Reports/v2/ReportChartV2'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { ObservabilityLink } from '@/components/ui/ObservabilityLink'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { realtimeReports } from '@/data/reports/v2/realtime.config'
import { useRefreshHandler, useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import type { NextPageWithLayout } from '@/types'

const RealtimeReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <RealtimeUsage />
    </ReportPadding>
  )
}

RealtimeReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Realtime">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export type UpdateDateRange = (from: string, to: string) => void
export default RealtimeReport

const REPORT_TITLE = 'Realtime'

const RealtimeUsage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const { db, chart, ref } = useParams()

  const {
    selectedDateRange,
    updateDateRange: updateDateRangeFromHook,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)
  const queryClient = useQueryClient()
  const {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
    filters,
    addFilter,
    removeFilters,
    isLoadingData,
    sql,
  } = useSharedAPIReport({
    filterBy: 'realtime',
    start: selectedDateRange?.period_start?.date,
    end: selectedDateRange?.period_end?.date,
  })

  const chartSyncId = `realtime-${ref}`

  const state = useDatabaseSelectorStateSnapshot()

  const reportConfig = useMemo(() => {
    return realtimeReports({
      projectRef: ref!,
      startDate: selectedDateRange?.period_start?.date ?? '',
      endDate: selectedDateRange?.period_end?.date ?? '',
      interval: selectedDateRange?.interval ?? 'minute',
      databaseIdentifier: state.selectedDatabaseId,
    })
  }, [ref, selectedDateRange, state.selectedDatabaseId])

  const onRefreshReport = useRefreshHandler(
    datePickerValue,
    datePickerHelpers,
    handleDatePickerChange,
    async () => {
      if (!selectedDateRange) return

      setIsRefreshing(true)

      queryClient.invalidateQueries({
        queryKey: ['projects', ref, 'report-v2', { queryGroup: 'realtime' }],
      })
      refetch()
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  )

  useShortcut(SHORTCUT_IDS.OBSERVABILITY_REFRESH, onRefreshReport, {
    enabled: !isRefreshing,
  })
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER, () => {
    setShowDatePicker((open) => !open)
  })

  const urlStateHasSyncedRef = useRef(false)
  useEffect(() => {
    if (urlStateHasSyncedRef.current) return
    urlStateHasSyncedRef.current = true

    if (db !== undefined) {
      setTimeout(() => {
        // [Joshen] Adding a timeout here to support navigation from settings to reports
        // Both are rendering different instances of ProjectLayout which is where the
        // DatabaseSelectorContextProvider lies in (unless we reckon shifting the provider up one more level is better)
        state.setSelectedDatabaseId(db)
      }, 100)
    }
    if (chart !== undefined) {
      setTimeout(() => {
        const el = document.getElementById(chart)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 200)
    }
  }, [db, chart, state])

  const updateDateRange: UpdateDateRange = (from: string, to: string) => {
    updateDateRangeFromHook(from, to)
  }

  return (
    <>
      <ReportHeader showDatabaseSelector={false} title={REPORT_TITLE} />
      <ReportStickyNav
        content={
          <div className="flex flex-col gap-3 w-full">
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <DocsButton href={OBSERVABILITY_DOCS_HREFS.realtime} topic={REPORT_TITLE} />
              <ShortcutTooltip
                shortcutId={SHORTCUT_IDS.OBSERVABILITY_REFRESH}
                label="Refresh report"
                side="bottom"
              >
                <Button
                  variant="default"
                  disabled={isRefreshing}
                  icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
                  className="w-7"
                  onClick={onRefreshReport}
                />
              </ShortcutTooltip>
              <LogsDatePicker
                onSubmit={handleDatePickerChange}
                value={datePickerValue}
                helpers={datePickerHelpers}
                open={showDatePicker}
                onOpenChange={setShowDatePicker}
                shortcutId={SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER}
              />
              <UpgradePrompt
                show={showUpgradePrompt}
                setShowUpgradePrompt={setShowUpgradePrompt}
                title="Report date range"
                description="Report data can be stored for a maximum of 3 months depending on the plan that your project is on."
                source="realtimeReportDateRange"
              />
              {selectedDateRange && (
                <div className="flex items-center gap-x-2 text-xs">
                  <p className="text-foreground-light">
                    {dayjs(selectedDateRange.period_start.date).format('MMM D, h:mma')}
                  </p>
                  <p className="text-foreground-light">
                    <ArrowRight size={12} />
                  </p>
                  <p className="text-foreground-light">
                    {dayjs(selectedDateRange.period_end.date).format('MMM D, h:mma')}
                  </p>
                </div>
              )}
            </div>
          </div>
        }
      >
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {selectedDateRange &&
            reportConfig
              .filter((report) => !report.hide)
              .map((report) => (
                <ReportChartV2
                  key={`${report.id}`}
                  queryGroup="realtime"
                  report={report}
                  projectRef={ref!}
                  interval={selectedDateRange.interval}
                  startDate={selectedDateRange?.period_start?.date}
                  endDate={selectedDateRange?.period_end?.date}
                  updateDateRange={updateDateRange}
                  syncId={chartSyncId}
                />
              ))}
        </div>
        <div className="">
          <div className="mb-4">
            <h5 className="text-foreground mb-2">Realtime API Gateway</h5>
            <ReportFilterBar
              filters={filters}
              onAddFilter={addFilter}
              onRemoveFilters={removeFilters}
              isLoading={isLoadingData || isRefetching}
              hideDatepicker={true}
              datepickerHelpers={datePickerHelpers}
              selectedProduct={'realtime'}
              showDatabaseSelector={false}
            />
          </div>
          <SharedAPIReport
            data={data}
            error={error}
            isLoading={isLoading}
            isRefetching={isRefetching}
            hiddenReports={['networkTraffic']}
            sql={sql}
          />
        </div>
      </ReportStickyNav>
      <div className="py-8">
        <ObservabilityLink />
      </div>
    </>
  )
}

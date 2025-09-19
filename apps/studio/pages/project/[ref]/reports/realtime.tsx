import { useEffect, useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useParams } from 'common'

import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import {
  LogsDatePicker,
  DatePickerValue,
} from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { ReportChartV2 } from 'components/interfaces/Reports/v2/ReportChartV2'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'

import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'

import type { NextPageWithLayout } from 'types'
import { SharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport'
import { useSharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport.constants'
import { realtimeReports } from 'data/reports/v2/realtime.config'
import { useChartHoverState } from 'components/ui/Charts/useChartHoverState'
import { ReportSettings } from 'components/ui/Charts/ReportSettings'

const RealtimeReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <RealtimeUsage />
    </ReportPadding>
  )
}

RealtimeReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Realtime">{page}</ReportsLayout>
  </DefaultLayout>
)

export type UpdateDateRange = (from: string, to: string) => void
export default RealtimeReport

const RealtimeUsage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { db, chart, ref } = useParams()

  const {
    selectedDateRange,
    updateDateRange: updateDateRangeFromHook,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
    isOrgPlanLoading,
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

  const state = useDatabaseSelectorStateSnapshot()
  const { plan: orgPlan } = useCurrentOrgPlan()
  const isFreePlan = !isOrgPlanLoading && orgPlan?.id === 'free'

  const chartSyncId = `realtime-report`

  useChartHoverState(chartSyncId)

  const reportConfig = useMemo(() => {
    return realtimeReports({
      projectRef: ref!,
      startDate: selectedDateRange?.period_start?.date ?? '',
      endDate: selectedDateRange?.period_end?.date ?? '',
      interval: selectedDateRange?.interval ?? 'minute',
      databaseIdentifier: state.selectedDatabaseId,
      isFreePlan,
    })
  }, [ref, selectedDateRange, state.selectedDatabaseId, isFreePlan])

  const onRefreshReport = async () => {
    if (!selectedDateRange) return

    setIsRefreshing(true)
    queryClient.invalidateQueries(['report-v2'])
    refetch()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  useEffect(() => {
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
      <ReportHeader showDatabaseSelector={false} title="Realtime" />
      <ReportStickyNav
        content={
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <ButtonTooltip
                type="default"
                disabled={isRefreshing}
                icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
                className="w-7"
                tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
                onClick={onRefreshReport}
              />
              <ReportSettings chartId="realtime-charts" />
              <LogsDatePicker
                onSubmit={handleDatePickerChange}
                value={datePickerValue}
                helpers={datePickerHelpers}
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
    </>
  )
}

import { useEffect, useState } from 'react'
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
import {
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import ComposedChartHandler from 'components/ui/Charts/ComposedChartHandler'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'

import { analyticsKeys } from 'data/analytics/keys'
import { getRealtimeReportAttributes } from 'data/reports/realtime-charts'
import { useApiReport } from 'data/reports/api-report-query'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'

import type { NextPageWithLayout } from 'types'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import { SharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport'

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
  const report = useApiReport()

  const {
    data,
    error,
    filters,
    isLoading,
    params,
    mergeParams,
    removeFilters,
    addFilter,
    refresh,
  } = report

  const state = useDatabaseSelectorStateSnapshot()
  const {
    selectedDateRange,
    updateDateRange: updateDateRangeFromHook,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange: handleDatePickerChangeFromHook,
    isOrgPlanLoading,
    orgPlan,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const queryClient = useQueryClient()

  const isFreePlan = !isOrgPlanLoading && orgPlan?.id === 'free'
  const REALTIME_REPORT_ATTRIBUTES = getRealtimeReportAttributes(isFreePlan)

  const onRefreshReport = async () => {
    if (!selectedDateRange) return

    // [Joshen] Since we can't track individual loading states for each chart
    // so for now we mock a loading state that only lasts for a second
    setIsRefreshing(true)

    const { period_start, period_end, interval } = selectedDateRange
    REALTIME_REPORT_ATTRIBUTES.forEach((attr) => {
      queryClient.invalidateQueries(
        analyticsKeys.infraMonitoring(ref, {
          attribute: attr?.id,
          startDate: period_start.date,
          endDate: period_end.date,
          interval,
          databaseIdentifier: state.selectedDatabaseId,
        })
      )
    })

    refresh()

    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // [Joshen] Empty dependency array as we only want this running once
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
  }, [])

  const handleDatePickerChange = (values: DatePickerValue) => {
    const promptShown = handleDatePickerChangeFromHook(values)
    if (!promptShown) {
      report.mergeParams({
        iso_timestamp_start: values.from,
        iso_timestamp_end: values.to,
      })
    }
  }

  const updateDateRange: UpdateDateRange = (from: string, to: string) => {
    updateDateRangeFromHook(from, to)
    report.mergeParams({
      iso_timestamp_start: from,
      iso_timestamp_end: to,
    })
  }

  return (
    <>
      <ReportHeader showDatabaseSelector={false} title="Realtime" />
      <ReportStickyNav
        content={
          <>
            <ButtonTooltip
              type="default"
              disabled={isRefreshing}
              icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
              className="w-7"
              tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
              onClick={onRefreshReport}
            />
            <div className="flex items-center gap-3">
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
          </>
        }
      >
        {selectedDateRange &&
          REALTIME_REPORT_ATTRIBUTES.filter((chart) => !chart.hide).map((chart) => (
            <ComposedChartHandler
              key={chart.id}
              {...chart}
              attributes={chart.attributes as MultiAttribute[]}
              interval={selectedDateRange.interval}
              startDate={selectedDateRange?.period_start?.date}
              endDate={selectedDateRange?.period_end?.date}
              updateDateRange={updateDateRange}
              defaultChartStyle={chart.defaultChartStyle as 'line' | 'bar' | 'stackedAreaLine'}
            />
          ))}
        <div className="relative pt-8 mt-8 border-t">
          <SharedAPIReport
            filterBy="realtime"
            start={selectedDateRange?.period_start?.date}
            end={selectedDateRange?.period_end?.date}
            hiddenReports={['networkTraffic']}
          />
        </div>
      </ReportStickyNav>
    </>
  )
}

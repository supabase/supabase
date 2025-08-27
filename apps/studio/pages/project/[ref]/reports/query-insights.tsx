import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'
import { NextPageWithLayout } from 'types'
import { QueryQuickGlance } from 'components/interfaces/QueryInsights/QueryQuickGlance'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { RefreshCw, ArrowRight } from 'lucide-react'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import dayjs from 'dayjs'
import { useState } from 'react'
import { QueryRowExplorer } from 'components/interfaces/QueryInsights/QueryRowExplorer'
import { QueryMetricExplorer } from 'components/interfaces/QueryInsights/QueryMetricExplorer'

const QueryInsightsReport: NextPageWithLayout = () => {
  return (
    <>
      <ReportPadding>
        <QueryInsights />
      </ReportPadding>
    </>
  )
}

QueryInsightsReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Query Insights">{page}</ReportsLayout>
  </DefaultLayout>
)

export default QueryInsightsReport

const QueryInsights = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const {
    selectedDateRange,
    updateDateRange,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  // Convert selectedDateRange to startTime and endTime for QueryMetricExplorer
  const startTime = selectedDateRange?.period_start?.date ? dayjs(selectedDateRange.period_start.date).toISOString() : undefined
  const endTime = selectedDateRange?.period_end?.date ? dayjs(selectedDateRange.period_end.date).toISOString() : undefined

  return (
    <>
      <div className="flex flex-row justify-between gap-4 items-center">
        <h1>Query Insights</h1>
        <LogsDatePicker
          onSubmit={handleDatePickerChange}
          value={datePickerValue}
          helpers={datePickerHelpers}
        />
      </div>
      <QueryQuickGlance startTime={startTime} endTime={endTime} />
      <QueryMetricExplorer startTime={startTime} endTime={endTime} />
    </>
  )
}

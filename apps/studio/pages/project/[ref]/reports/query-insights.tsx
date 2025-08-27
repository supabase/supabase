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

const QueryInsightsReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <QueryInsights />
    </ReportPadding>
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

  return (
    <>
      <ReportHeader title="Query Insights" />
      <ReportStickyNav
        content={
          <>
            <ButtonTooltip
              type="default"
              disabled={false}
              icon={<RefreshCw className={false ? 'animate-spin' : ''} />}
              className="w-7"
              tooltip={{ content: { side: 'bottom', text: 'Reset time range' } }}
              onClick={() => console.log('hey')}
            />
            <div className="flex items-center gap-3">
              <LogsDatePicker
                onSubmit={handleDatePickerChange}
                value={datePickerValue}
                helpers={datePickerHelpers}
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
      />
      <QueryQuickGlance />
      <div>Tab group</div>
      <div>Metrics explorer...</div>
      <div>Row expolrer...</div>
    </>
  )
}

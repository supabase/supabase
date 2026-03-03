import { QueryInsights } from 'components/interfaces/QueryInsights/QueryInsights'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import ObservabilityLayout from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import { DatabaseSelector } from 'components/ui/DatabaseSelector'
import { DocsButton } from 'components/ui/DocsButton'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const QueryInsightsReport: NextPageWithLayout = () => {
  const { selectedDateRange, datePickerValue, datePickerHelpers, handleDatePickerChange } =
    useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  return (
    <div className="h-full flex flex-col">
      <div className="w-full mb-0 flex lg:items-center justify-between gap-4 py-2 px-6 lg:flex-row flex-col border-b lg:h-[48px]">
        <h3 className="text-foreground text-xl prose">Query Insights</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <DocsButton
            href={`${DOCS_URL}/guides/platform/performance#examining-query-performance`}
          />
          <DatabaseSelector />
          <LogsDatePicker
            value={datePickerValue}
            helpers={datePickerHelpers.filter(
              (h) =>
                h.text === REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES ||
                h.text === REPORT_DATERANGE_HELPER_LABELS.LAST_3_HOURS ||
                h.text === REPORT_DATERANGE_HELPER_LABELS.LAST_24_HOURS
            )}
            onSubmit={handleDatePickerChange}
          />
        </div>
      </div>
      <QueryInsights dateRange={selectedDateRange} />
    </div>
  )
}

QueryInsightsReport.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Query insights">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default QueryInsightsReport

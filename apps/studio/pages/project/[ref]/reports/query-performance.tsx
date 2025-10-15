import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'

import { useParams } from 'common'
import { EnableIndexAdvisorButton } from 'components/interfaces/QueryPerformance/IndexAdvisor/EnableIndexAdvisorButton'
import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { useQueryPerformanceSort } from 'components/interfaces/QueryPerformance/hooks/useQueryPerformanceSort'
import { QueryPerformance } from 'components/interfaces/QueryPerformance/QueryPerformance'
import { PRESET_CONFIG } from 'components/interfaces/Reports/Reports.constants'
import { useQueryPerformanceQuery } from 'components/interfaces/Reports/Reports.queries'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()
  const { sort: sortConfig } = useQueryPerformanceSort()

  const {
    selectedDateRange,
    datePickerValue,
    datePickerHelpers,
    updateDateRange,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const [{ search: searchQuery, roles }] = useQueryStates({
    sort: parseAsString,
    order: parseAsString,
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
  })

  const config = PRESET_CONFIG[Presets.QUERY_PERFORMANCE]
  const hooks = queriesFactory(config.queries, ref ?? 'default')
  const queryHitRate = hooks.queryHitRate()
  const queryMetrics = hooks.queryMetrics()

  const queryPerformanceQuery = useQueryPerformanceQuery({
    searchQuery,
    orderBy: sortConfig || undefined,
    preset: 'unified',
    roles,
    runIndexAdvisor: isIndexAdvisorEnabled,
  })

  const isPgStatMonitorEnabled = project?.dbVersion === '17.4.1.076-psml-1'

  return (
    <div className="h-full flex flex-col">
      <FormHeader
        className="py-4 px-6 !mb-0 md:flex-row flex-col"
        title="Query Performance"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <EnableIndexAdvisorButton />
            <DocsButton
              href={`${DOCS_URL}/guides/platform/performance#examining-query-performance`}
            />
            <DatabaseSelector />
            {isPgStatMonitorEnabled && (
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
            )}
          </div>
        }
      />
      <QueryPerformance
        queryHitRate={queryHitRate}
        queryPerformanceQuery={queryPerformanceQuery}
        queryMetrics={queryMetrics}
        isPgStatMonitorEnabled={isPgStatMonitorEnabled}
        dateRange={selectedDateRange}
        onDateRangeChange={updateDateRange}
      />
    </div>
  )
}

QueryPerformanceReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Query performance">{page}</ReportsLayout>
  </DefaultLayout>
)

export default QueryPerformanceReport

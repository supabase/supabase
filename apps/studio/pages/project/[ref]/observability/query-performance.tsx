import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'

import { useParams } from 'common'
import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { useQueryPerformanceSort } from 'components/interfaces/QueryPerformance/hooks/useQueryPerformanceSort'
import { QueryPerformance } from 'components/interfaces/QueryPerformance/QueryPerformance'
import {
  PRESET_CONFIG,
  REPORT_DATERANGE_HELPER_LABELS,
} from 'components/interfaces/Reports/Reports.constants'
import { useQueryPerformanceQuery } from 'components/interfaces/Reports/Reports.queries'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import { queriesFactory } from 'components/interfaces/Reports/Reports.utils'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import ObservabilityLayout from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import { DatabaseSelector } from 'components/ui/DatabaseSelector'
import { DocsButton } from 'components/ui/DocsButton'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Admonition } from 'ui-patterns'

const QueryPerformanceReport: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { data: project, isLoading: isLoadingProject } = useSelectedProjectQuery()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()
  const { sort: sortConfig } = useQueryPerformanceSort()

  const {
    selectedDateRange,
    datePickerValue,
    datePickerHelpers,
    updateDateRange,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const [{ search: searchQuery, roles, minCalls, indexAdvisor }] = useQueryStates({
    sort: parseAsString,
    order: parseAsString,
    search: parseAsString.withDefault(''),
    roles: parseAsArrayOf(parseAsString).withDefault([]),
    minCalls: parseAsInteger,
    indexAdvisor: parseAsString.withDefault('false'),
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
    minCalls: minCalls ?? undefined,
    filterIndexAdvisor: indexAdvisor === 'true',
  })

  const isPgStatMonitorEnabled = project?.dbVersion === '17.4.1.076-psml-1'

  if (!ref) {
    return (
      <div className="h-full flex flex-col p-6">
        <Admonition
          type="destructive"
          title="Invalid project reference"
          description="Unable to load query performance data. Please ensure you have selected a valid project."
        />
      </div>
    )
  }

  if (!isLoadingProject && !project) {
    return (
      <div className="h-full flex flex-col p-6">
        <Admonition
          type="destructive"
          title="Project not found"
          description="Unable to load project data. Please check your project reference and try again."
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="w-full mb-0 flex lg:items-center justify-between gap-4 py-4 px-6 lg:flex-row flex-col">
        <h3 className="text-foreground text-xl prose">Query Performance</h3>
        <div className="flex items-center gap-2 flex-wrap">
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
      </div>
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
    <ObservabilityLayout title="Query performance">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default QueryPerformanceReport

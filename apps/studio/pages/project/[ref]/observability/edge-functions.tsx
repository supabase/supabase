import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { parseAsJson, useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'
import { Button } from 'ui'

import { OBSERVABILITY_DOCS_HREFS } from '@/components/interfaces/Observability/Observability.constants'
import ReportHeader from '@/components/interfaces/Reports/ReportHeader'
import ReportPadding from '@/components/interfaces/Reports/ReportPadding'
import {
  EDGE_FUNCTION_REGIONS,
  REPORT_DATERANGE_HELPER_LABELS,
} from '@/components/interfaces/Reports/Reports.constants'
import ReportStickyNav from '@/components/interfaces/Reports/ReportStickyNav'
import { ReportChartV2 } from '@/components/interfaces/Reports/v2/ReportChartV2'
import {
  numericFilterSchema,
  ReportsNumericFilter,
} from '@/components/interfaces/Reports/v2/ReportsNumericFilter'
import {
  ReportsSelectFilter,
  selectFilterSchema,
} from '@/components/interfaces/Reports/v2/ReportsSelectFilter'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import UpgradePrompt from '@/components/interfaces/Settings/Logs/UpgradePrompt'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import { ReportSettings } from '@/components/ui/Charts/ReportSettings'
import { useChartHoverState } from '@/components/ui/Charts/useChartHoverState'
import { DocsButton } from '@/components/ui/DocsButton'
import { ObservabilityLink } from '@/components/ui/ObservabilityLink'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useEdgeFunctionsQuery } from '@/data/edge-functions/edge-functions-query'
import { edgeFunctionReports } from '@/data/reports/v2/edge-functions.config'
import { useRefreshHandler, useReportDateRange } from '@/hooks/misc/useReportDateRange'
import { BASE_PATH } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
import type { NextPageWithLayout } from '@/types'

const EdgeFunctionsReportV2: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <EdgeFunctionsUsage />
    </ReportPadding>
  )
}

EdgeFunctionsReportV2.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Edge Functions">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default EdgeFunctionsReportV2

const REPORT_TITLE = 'Edge Functions'

const EdgeFunctionsUsage = () => {
  const { ref } = useParams()
  const { data: functions } = useEdgeFunctionsQuery({
    projectRef: ref,
  })

  const chartSyncId = `edge-functions-${ref}`
  useChartHoverState(chartSyncId)

  // Filters
  const [statusCodeFilter, setStatusCodeFilter] = useQueryState(
    'status_code',
    parseAsJson(numericFilterSchema.parse)
  )

  const [regionFilter, setRegionFilter] = useQueryState(
    'region',
    parseAsJson(selectFilterSchema.parse)
  )
  const [executionTimeFilter, setExecutionTimeFilter] = useQueryState(
    'execution_time',
    parseAsJson(numericFilterSchema.parse)
  )

  const [functionFilter, setFunctionFilter] = useQueryState(
    'functions',
    parseAsJson(selectFilterSchema.parse)
  )

  const {
    selectedDateRange,
    updateDateRange,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const reportConfig = useMemo(() => {
    return edgeFunctionReports({
      projectRef: ref!,
      functions: functions ?? [],
      startDate: selectedDateRange?.period_start?.date ?? '',
      endDate: selectedDateRange?.period_end?.date ?? '',
      interval: selectedDateRange?.interval ?? 'minute',
      filters: {
        functions: functionFilter ?? [],
        status_code: statusCodeFilter,
        region: regionFilter ?? [],
        execution_time: executionTimeFilter,
      },
    })
  }, [
    ref,
    functions,
    selectedDateRange,
    functionFilter,
    statusCodeFilter,
    regionFilter,
    executionTimeFilter,
  ])

  const onRefreshReport = useRefreshHandler(
    datePickerValue,
    datePickerHelpers,
    handleDatePickerChange,
    async () => {
      if (!selectedDateRange) return

      setIsRefreshing(true)
      queryClient.invalidateQueries({ queryKey: ['projects', ref, 'report-v2'] })
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  )

  useShortcut(SHORTCUT_IDS.OBSERVABILITY_REFRESH, onRefreshReport, {
    enabled: !isRefreshing,
  })
  useShortcut(SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER, () => {
    setShowDatePicker((open) => !open)
  })

  return (
    <>
      <ReportHeader title={REPORT_TITLE} showDatabaseSelector={false} />
      <ReportStickyNav
        content={
          <div className="flex flex-col gap-2 w-full">
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <DocsButton href={OBSERVABILITY_DOCS_HREFS.edgeFunctions} topic={REPORT_TITLE} />
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

              <ReportSettings chartId="edge-functions-charts" />

              <LogsDatePicker
                align="start"
                value={datePickerValue}
                helpers={datePickerHelpers}
                onSubmit={handleDatePickerChange}
                open={showDatePicker}
                onOpenChange={setShowDatePicker}
                shortcutId={SHORTCUT_IDS.OBSERVABILITY_TOGGLE_DATE_PICKER}
              />
              <UpgradePrompt
                show={showUpgradePrompt}
                setShowUpgradePrompt={setShowUpgradePrompt}
                title="Report date range"
                description="Report data can be stored for a maximum of 3 months depending on the plan that your project is on."
                source="edgeFunctionsReportDateRange"
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
            <div className="w-full flex items-center gap-2 flex-wrap">
              <ReportsSelectFilter
                label="Function"
                options={
                  functions?.map((fn: { name: string; id: string }) => ({
                    label: fn.name,
                    value: fn.id,
                  })) ?? []
                }
                value={functionFilter ?? []}
                onChange={setFunctionFilter}
                isLoading={isRefreshing}
                showSearch
              />

              <ReportsNumericFilter
                label="Status Code"
                value={statusCodeFilter}
                onChange={setStatusCodeFilter}
                defaultOperator="="
                isLoading={isRefreshing}
              />

              <ReportsNumericFilter
                label="Execution Time"
                value={executionTimeFilter}
                onChange={setExecutionTimeFilter}
                placeholder="Enter time in ms"
                min={0}
                max={99999}
                defaultOperator=">="
                isLoading={isRefreshing}
              />

              <ReportsSelectFilter
                label="Region"
                options={EDGE_FUNCTION_REGIONS.map((region) => ({
                  value: region.key,
                  label: (
                    <div className="flex items-center gap-x-2">
                      <img
                        src={`${BASE_PATH}/img/regions/${region.key}.svg`}
                        alt={region.key}
                        className="w-4 h-4"
                      />
                      <div className="flex flex-wrap gap-x-2 items-center">
                        <span className="text-foreground text-xs">{region.label}</span>
                        <span className="text-foreground-lighter text-xs">{region.key}</span>
                      </div>
                    </div>
                  ),
                }))}
                value={regionFilter ?? []}
                onChange={setRegionFilter}
                showSearch
              />
            </div>
          </div>
        }
      >
        <div className="mt-8 flex flex-col gap-4 pb-8">
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
                  filters={{
                    functions: functionFilter,
                    status_code: statusCodeFilter,
                    region: regionFilter,
                    execution_time: executionTimeFilter,
                  }}
                />
              ))}
        </div>
      </ReportStickyNav>
      <div className="pb-8">
        <ObservabilityLink />
      </div>
    </>
  )
}

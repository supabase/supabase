import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, LogsIcon, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ReportChartV2 } from 'components/interfaces/Reports/v2/ReportChartV2'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import { SharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport'
import { useSharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport.constants'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import type { NextPageWithLayout } from 'types'
import { createAuthReportConfig } from 'data/reports/v2/auth.config'
import { ReportSettings } from 'components/ui/Charts/ReportSettings'
import type { ChartHighlightAction } from 'components/ui/Charts/ChartHighlightActions'
import { useRouter } from 'next/router'
import {
  ReportsNumericFilter,
  numericFilterSchema,
} from 'components/interfaces/Reports/v2/ReportsNumericFilter'
import { useQueryState, parseAsJson } from 'nuqs'
import {
  ReportModeSelector,
  useReportModeState,
} from 'components/interfaces/Reports/v2/ReportModeSelector'

const AuthReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <AuthUsage />
    </ReportPadding>
  )
}

AuthReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Auth">{page}</ReportsLayout>
  </DefaultLayout>
)

export type UpdateDateRange = (from: string, to: string) => void
export default AuthReport

const AuthUsage = () => {
  const { ref } = useParams()
  const chartSyncId = `auth-report`

  const {
    selectedDateRange,
    updateDateRange,
    datePickerValue,
    datePickerHelpers,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleDatePickerChange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

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
    filterBy: 'auth',
    start: selectedDateRange?.period_start?.date,
    end: selectedDateRange?.period_end?.date,
  })

  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [statusCodeFilter, setStatusCodeFilter] = useQueryState(
    'status_code',
    parseAsJson(numericFilterSchema.parse)
  )

  const { value: modeFilter, setValue: setModeFilter } = useReportModeState()

  const authReportConfig = createAuthReportConfig({
    projectRef: ref || '',
    startDate: selectedDateRange?.period_start?.date,
    endDate: selectedDateRange?.period_end?.date,
    interval: selectedDateRange?.interval,
    filters: { status_code: statusCodeFilter },
  })

  const onRefreshReport = async () => {
    if (!selectedDateRange) return

    setIsRefreshing(true)

    refetch()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const router = useRouter()

  const highlightActions: ChartHighlightAction[] = [
    {
      id: 'api-gateway-logs',
      label: 'Open in API Gateway Logs',
      icon: <LogsIcon size={12} />,
      onSelect: ({ start, end, clear }) => {
        const url = `/project/${ref}/logs/edge-logs?its=${start}&ite=${end}&f={"product":{"auth":true}}`
        router.push(url)
      },
    },
    {
      id: 'auth-logs',
      label: 'Open in Auth Logs',
      icon: <LogsIcon size={12} />,
      onSelect: ({ start, end, clear }) => {
        const url = `/project/${ref}/logs/auth-logs?its=${start}&ite=${end}`
        router.push(url)
      },
    },
  ]

  return (
    <>
      <ReportHeader title="Auth" showDatabaseSelector={false} />
      <ReportStickyNav
        content={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ButtonTooltip
                type="default"
                disabled={isRefreshing}
                icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
                className="w-7"
                tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
                onClick={onRefreshReport}
              />
              <ReportSettings chartId={chartSyncId} />
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
                source="authReportDateRange"
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
              <ReportModeSelector value={modeFilter} onChange={setModeFilter} />
              <ReportsNumericFilter
                label="Status Code"
                value={statusCodeFilter}
                onChange={setStatusCodeFilter}
                defaultOperator="="
                isLoading={isRefreshing}
              />
            </div>
          </div>
        }
      >
        <div className="mt-8 flex flex-col gap-4 pb-24">
          {(() => {
            const metrics = Array.isArray(authReportConfig) ? authReportConfig : []
            if (modeFilter === 'debug') {
              return metrics.filter((m) => m.id.includes('error'))
            }
            if (modeFilter === 'usage') {
              const usageIds = new Set([
                'active-user',
                'sign-in-attempts',
                'signups',
                'password-reset-requests',
              ])
              return metrics.filter((m) => usageIds.has(m.id))
            }
            return metrics
          })().map((metric, i) => (
            <ReportChartV2
              key={`${metric.id}`}
              report={metric}
              projectRef={ref!}
              interval={selectedDateRange.interval}
              startDate={selectedDateRange?.period_start?.date}
              endDate={selectedDateRange?.period_end?.date}
              updateDateRange={updateDateRange}
              syncId={chartSyncId}
              filters={{ status_code: statusCodeFilter }}
              highlightActions={highlightActions}
            />
          ))}
          <div>
            <div className="mb-4">
              <h5 className="text-foreground mb-2">Auth API Gateway</h5>
              <ReportFilterBar
                filters={filters}
                onAddFilter={addFilter}
                onRemoveFilters={removeFilters}
                isLoading={isLoadingData || isRefetching}
                hideDatepicker={true}
                datepickerHelpers={datePickerHelpers}
                selectedProduct={'auth'}
                showDatabaseSelector={false}
              />
            </div>
            <SharedAPIReport
              data={data}
              error={error}
              isLoading={isLoading}
              isRefetching={isRefetching}
              sql={sql}
            />
          </div>
        </div>
      </ReportStickyNav>
    </>
  )
}

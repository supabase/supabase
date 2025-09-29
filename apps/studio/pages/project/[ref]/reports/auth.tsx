import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, LogsIcon, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ReportChartV2 } from 'components/interfaces/Reports/v2/ReportChartV2'
import { ReportSectionHeader } from 'components/interfaces/Reports/v2/ReportSectionHeader'
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
import {
  createUsageReportConfig,
  createErrorsReportConfig,
  createLatencyReportConfig,
} from 'data/reports/v2/auth.config'
import { ReportSettings } from 'components/ui/Charts/ReportSettings'
import type { ChartHighlightAction } from 'components/ui/Charts/ChartHighlightActions'
import { useRouter } from 'next/router'
import {
  ReportsNumericFilter,
  numericFilterSchema,
} from 'components/interfaces/Reports/v2/ReportsNumericFilter'
import { useQueryState, parseAsJson } from 'nuqs'

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

  const usageReportConfig = createUsageReportConfig({
    projectRef: ref || '',
    startDate: selectedDateRange?.period_start?.date,
    endDate: selectedDateRange?.period_end?.date,
    interval: selectedDateRange?.interval,
    filters: { status_code: statusCodeFilter },
  })

  const errorsReportConfig = createErrorsReportConfig({
    projectRef: ref || '',
    startDate: selectedDateRange?.period_start?.date,
    endDate: selectedDateRange?.period_end?.date,
    interval: selectedDateRange?.interval,
    filters: { status_code: statusCodeFilter },
  })

  const latencyReportConfig = createLatencyReportConfig({
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
      onSelect: ({ start, end, clear, chartId }) => {
        let url = `/project/${ref}/logs/edge-logs?its=${start}&ite=${end}`

        if (chartId?.includes('errors')) {
          url += `&f={"product":{"auth":true},"status_code":{"error":true,"warning":true}}`
        }

        url += `&f={"product":{"auth":true}}`
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
        <div className="mt-8 flex flex-col gap-8 pb-24">
          <div className="flex flex-col gap-4" id="usage">
            <ReportSectionHeader
              id="usage"
              title="Usage"
              description="Monitor user activity, sign-ins, sign-ups, and password reset requests to understand how users interact with your authentication system."
            />
            <div className="grid md:grid-cols-2 gap-4">
              {usageReportConfig.map((metric) => (
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
            </div>
          </div>

          {/* Errors Section */}
          <div className="flex flex-col gap-4" id="errors">
            <ReportSectionHeader
              id="errors"
              title="Errors"
              description="Track authentication errors by status code and error type to identify issues and improve user experience."
            />
            <div className="grid md:grid-cols-2 gap-4">
              {errorsReportConfig.map((metric) => (
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
            </div>
          </div>

          {/* Latency Section */}
          <div className="flex flex-col gap-4" id="latency">
            <ReportSectionHeader
              id="latency"
              title="Latency"
              description="Monitor sign-in and sign-up performance metrics including average, percentiles, and request counts to ensure optimal authentication speed."
            />
            <div className="grid md:grid-cols-2 gap-4">
              {latencyReportConfig.map((metric) => (
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
            </div>
          </div>
          <div>
            <div className="mb-4 space-y-4">
              <ReportSectionHeader
                id="auth-api-gateway"
                title="Auth API Gateway"
                description="Monitor user activity, sign-ins, sign-ups, and password reset requests to understand how users interact with your authentication system."
              />
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

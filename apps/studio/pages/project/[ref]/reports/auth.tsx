import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowRight, LogsIcon, RefreshCw } from 'lucide-react'
import { useState } from 'react'

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

  const authReportConfig = createAuthReportConfig({
    projectRef: ref || '',
    startDate: selectedDateRange?.period_start?.date,
    endDate: selectedDateRange?.period_end?.date,
    interval: selectedDateRange?.interval,
    filters: { status_code: null },
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
          <>
            <ButtonTooltip
              type="default"
              disabled={isRefreshing}
              icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
              className="w-7"
              tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
              onClick={onRefreshReport}
            />
            <ReportSettings chartId={chartSyncId} />
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
          </>
        }
      >
        {authReportConfig.map((metric, i) => (
          <ReportChartV2
            key={`${metric.id}`}
            report={metric}
            projectRef={ref!}
            interval={selectedDateRange.interval}
            startDate={selectedDateRange?.period_start?.date}
            endDate={selectedDateRange?.period_end?.date}
            updateDateRange={updateDateRange}
            syncId={chartSyncId}
            filters={{
              status_code: null,
            }}
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
      </ReportStickyNav>
    </>
  )
}

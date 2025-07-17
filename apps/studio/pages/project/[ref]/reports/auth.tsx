import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useParams } from 'common'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import ReportChart from 'components/interfaces/Reports/ReportChart'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'

import { getAuthReportAttributes } from 'data/reports/auth-charts'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'
import type { NextPageWithLayout } from 'types'
import { SharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport'
import { useSharedAPIReport } from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport.constants'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'

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

  const {
    selectedDateRange,
    updateDateRange,
    datePickerValue,
    datePickerHelpers,
    isOrgPlanLoading,
    orgPlan,
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
  } = useSharedAPIReport({
    filterBy: 'auth',
    start: selectedDateRange?.period_start?.date,
    end: selectedDateRange?.period_end?.date,
  })

  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isFreePlan = !isOrgPlanLoading && orgPlan?.id === 'free'
  const AUTH_REPORT_ATTRIBUTES = getAuthReportAttributes(isFreePlan)

  const onRefreshReport = async () => {
    if (!selectedDateRange) return

    setIsRefreshing(true)
    AUTH_REPORT_ATTRIBUTES.forEach((attr) => {
      attr.attributes.forEach((subAttr) => {
        queryClient.invalidateQueries([
          'auth-metrics',
          ref,
          subAttr.attribute,
          selectedDateRange.period_start.date,
          selectedDateRange.period_end.date,
          selectedDateRange.interval,
        ])
      })
    })
    refetch()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

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
        {selectedDateRange &&
          AUTH_REPORT_ATTRIBUTES.filter((attr) => !attr.hide).map((attr, i) => (
            <ReportChart
              key={`${attr.id}-${i}`}
              chart={attr}
              interval={selectedDateRange.interval}
              startDate={selectedDateRange?.period_start?.date}
              endDate={selectedDateRange?.period_end?.date}
              updateDateRange={updateDateRange}
              orgPlanId={orgPlan?.id}
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
          />
        </div>
      </ReportStickyNav>
    </>
  )
}

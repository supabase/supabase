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

import type { NextPageWithLayout } from 'types'

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
    updateDateRange: updateDateRangeFromHook,
    handleDatePickerChange,
    datePickerValue,
    datePickerHelpers,
    isOrgPlanLoading,
    orgPlan,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

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
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const updateDateRange: UpdateDateRange = (from: string, to: string) => {
    updateDateRangeFromHook(from, to)
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
            />
          ))}
      </ReportStickyNav>
    </>
  )
}

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useParams } from 'common'

import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import { createFilteredDatePickerHelpers } from 'components/interfaces/Reports/Reports.constants'
import {
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import ComposedChartHandler from 'components/ui/Charts/ComposedChartHandler'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import { DatePickerValue } from 'components/interfaces/Settings/Logs/Logs.DatePickers'

import { analyticsKeys } from 'data/analytics/keys'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { TIME_PERIODS_INFRA } from 'lib/constants/metrics'
import { getRealtimeReportAttributes } from 'data/reports/realtime-charts'
import { useApiReport } from 'data/reports/api-report-query'

import type { NextPageWithLayout } from 'types'
import type { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'

const RealtimeReport: NextPageWithLayout = () => {
  return (
    <ReportPadding>
      <RealtimeUsage />
    </ReportPadding>
  )
}

RealtimeReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout title="Realtime">{page}</ReportsLayout>
  </DefaultLayout>
)

export type UpdateDateRange = (from: string, to: string) => void
export default RealtimeReport

const RealtimeUsage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { db, chart, ref } = useParams()
  const report = useApiReport()

  const {
    data,
    error,
    filters,
    isLoading,
    params,
    mergeParams,
    removeFilters,
    addFilter,
    refresh,
  } = report

  const state = useDatabaseSelectorStateSnapshot()
  const defaultStart = dayjs().subtract(7, 'day').toISOString()
  const defaultEnd = dayjs().toISOString()
  const [dateRange, setDateRange] = useState<any>({
    period_start: { date: defaultStart, time_period: '1d' },
    period_end: { date: defaultEnd, time_period: 'today' },
    interval: '1h',
  })

  const queryClient = useQueryClient()

  const { plan: orgPlan, isLoading: isOrgPlanLoading } = useCurrentOrgPlan()
  const isFreePlan = !isOrgPlanLoading && orgPlan?.id === 'free'

  const REALTIME_REPORT_ATTRIBUTES = getRealtimeReportAttributes(isFreePlan)

  const onRefreshReport = async () => {
    if (!dateRange) return

    // [Joshen] Since we can't track individual loading states for each chart
    // so for now we mock a loading state that only lasts for a second
    setIsRefreshing(true)

    const { period_start, interval } = dateRange
    REALTIME_REPORT_ATTRIBUTES.forEach((attr) => {
      queryClient.invalidateQueries(
        analyticsKeys.infraMonitoring(ref, {
          attribute: attr?.id,
          startDate: period_start.date,
          endDate: period_start.end,
          interval,
          databaseIdentifier: state.selectedDatabaseId,
        })
      )
    })

    refresh()

    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // [Joshen] Empty dependency array as we only want this running once
  useEffect(() => {
    if (db !== undefined) {
      setTimeout(() => {
        // [Joshen] Adding a timeout here to support navigation from settings to reports
        // Both are rendering different instances of ProjectLayout which is where the
        // DatabaseSelectorContextProvider lies in (unless we reckon shifting the provider up one more level is better)
        state.setSelectedDatabaseId(db)
      }, 100)
    }
    if (chart !== undefined) {
      setTimeout(() => {
        const el = document.getElementById(chart)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 200)
    }
  }, [])

  const handleIntervalGranularity = (from: string, to: string) => {
    const conditions = {
      '1m': dayjs(to).diff(from, 'hour') < 3, // less than 3 hours
      '10m': dayjs(to).diff(from, 'hour') < 6, // less than 6 hours
      '30m': dayjs(to).diff(from, 'hour') < 18, // less than 18 hours
      '1h': dayjs(to).diff(from, 'day') < 10, // less than 10 days
      '1d': dayjs(to).diff(from, 'day') >= 10, // more than 10 days
    }

    switch (true) {
      case conditions['1m']:
        return '1m'
      case conditions['10m']:
        return '10m'
      case conditions['30m']:
        return '30m'
      default:
        return '1h'
    }
  }

  const updateDateRange: UpdateDateRange = (from: string, to: string) => {
    setDateRange({
      period_start: { date: from, time_period: '1d' },
      period_end: { date: to, time_period: 'today' },
      interval: handleIntervalGranularity(from, to),
    })
    report.mergeParams({
      iso_timestamp_start: from,
      iso_timestamp_end: to,
    })
  }

  // const handleDatepickerChange = (vals: DatePickerValue) => {
  //   report.mergeParams({
  //     iso_timestamp_start: vals.from || '',
  //     iso_timestamp_end: vals.to || '',
  //   })
  //   setDateRange({
  //     period_start: { date: vals.from || '', time_period: '1d' },
  //     period_end: { date: vals.to || '', time_period: 'today' },
  //   })
  // }

  return (
    <>
      <ReportHeader showDatabaseSelector={false} title="Realtime" />
      <section className="relative pt-16 -mt-2">
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col gap-4">
          <div className="sticky top-0 bg-200 py-4 mb-4 flex items-center space-x-3 pointer-events-auto">
            <ButtonTooltip
              type="default"
              disabled={isRefreshing}
              icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
              className="w-7"
              tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
              onClick={onRefreshReport}
            />
            <div className="flex items-center gap-3">
              <DateRangePicker
                loading={false}
                value="1d"
                options={TIME_PERIODS_INFRA}
                currentBillingPeriodStart={undefined}
                onChange={(values) => {
                  if (values.interval === '1d') {
                    setDateRange({ ...values, interval: '1h' })
                  } else {
                    setDateRange(values)
                  }
                }}
              />
              {dateRange && (
                <div className="flex items-center gap-x-2 text-xs">
                  <p className="text-foreground-light">
                    {dayjs(dateRange.period_start.date).format('MMM D, h:mma')}
                  </p>
                  <p className="text-foreground-light">
                    <ArrowRight size={12} />
                  </p>
                  <p className="text-foreground-light">
                    {dayjs(dateRange.period_end.date).format('MMM D, h:mma')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {dateRange &&
            REALTIME_REPORT_ATTRIBUTES.filter((chart) => !chart.hide).map((chart) => (
              <ComposedChartHandler
                key={chart.id}
                {...chart}
                attributes={chart.attributes as MultiAttribute[]}
                interval={dateRange.interval}
                startDate={dateRange?.period_start?.date}
                endDate={dateRange?.period_end?.date}
                updateDateRange={updateDateRange}
                defaultChartStyle={chart.defaultChartStyle as 'line' | 'bar' | 'stackedAreaLine'}
              />
            ))}
        </div>
        <div className="relative pt-16 mt-4 border-t">
          <div className="absolute inset-0 z-40 pointer-events-none flex flex-col gap-4">
            <div className="sticky top-0 bg-200 py-4 mb-4 flex flex-col items-center pointer-events-auto gap-4">
              <ReportFilterBar
                onRemoveFilters={removeFilters}
                hideDatepicker={true}
                // onDatepickerChange={handleDatepickerChange}
                datepickerFrom={dateRange.from}
                datepickerTo={dateRange.to}
                onAddFilter={addFilter}
                // onRefresh={refresh}
                isLoading={isLoading}
                filters={filters}
                selectedProduct="realtime"
                datepickerHelpers={createFilteredDatePickerHelpers(orgPlan?.id || 'free')}
                className="w-full"
                showDatabaseSelector={false}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <ReportWidget
              isLoading={isLoading}
              params={params.totalRequests}
              title="Total Requests"
              data={data.totalRequests || []}
              error={error.totalRequest}
              renderer={TotalRequestsChartRenderer}
              append={TopApiRoutesRenderer}
              appendProps={{ data: data.topRoutes || [], params: params.topRoutes }}
            />
            <ReportWidget
              isLoading={isLoading}
              params={params.responseSpeed}
              title="Response Speed"
              tooltip="Average response speed (in miliseconds) of a request"
              data={data.responseSpeed || []}
              error={error.responseSpeed}
              renderer={ResponseSpeedChartRenderer}
              appendProps={{ data: data.topSlowRoutes || [], params: params.topSlowRoutes }}
              append={TopApiRoutesRenderer}
            />
          </div>
        </div>
      </section>
    </>
  )
}

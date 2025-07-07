import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import {
  ErrorCountsChartRenderer,
  NetworkTrafficRenderer,
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { useApiReport } from 'data/reports/api-report-query'
import { NextPageWithLayout } from 'types'

import { useCallback, useState } from 'react'
import dayjs from 'dayjs'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import { TIME_PERIODS_INFRA } from 'lib/constants/metrics'

export const ApiReport: NextPageWithLayout = () => {
  const report = useApiReport()

  const defaultStart = dayjs().subtract(1, 'day').toISOString()
  const defaultEnd = dayjs().toISOString()

  const [dateRange, setDateRange] = useState<any>({
    period_start: { date: defaultStart, time_period: '1d' },
    period_end: { date: defaultEnd, time_period: 'today' },
    interval: '1h',
  })

  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data, error, isLoading, params, mergeParams, refresh } = report

  const onRefreshReport = async () => {
    setIsRefreshing(true)
    refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const onPickerChange = useCallback(
    (values: any) => {
      setDateRange(values)
      mergeParams({
        iso_timestamp_start: values.period_start.date,
        iso_timestamp_end: values.period_end.date,
      })
    },
    [mergeParams]
  )

  return (
    <ReportPadding>
      <ReportHeader title="API Gateway" />
      <div className="w-full flex flex-col gap-1">
        <div className="sticky top-0 py-4 mb-4 flex items-center space-x-3 pointer-events-auto dark:bg-background-200 bg-background z-10">
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
              loading={isLoading}
              value={'1d'}
              options={TIME_PERIODS_INFRA}
              onChange={onPickerChange}
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
        params={params.errorCounts}
        title="Response Errors"
        tooltip="Error responses with 4XX or 5XX status codes"
        data={data.errorCounts || []}
        error={error.errorCounts}
        renderer={ErrorCountsChartRenderer}
        appendProps={{
          data: data.topErrorRoutes || [],
          params: params.topErrorRoutes,
        }}
        append={TopApiRoutesRenderer}
      />
      <ReportWidget
        isLoading={isLoading}
        params={params.responseSpeed}
        title="Response Speed"
        tooltip="Average response speed of a request (in ms)"
        data={data.responseSpeed || []}
        error={error.responseSpeed}
        renderer={ResponseSpeedChartRenderer}
        appendProps={{ data: data.topSlowRoutes || [], params: params.topSlowRoutes }}
        append={TopApiRoutesRenderer}
      />

      <ReportWidget
        isLoading={isLoading}
        params={params.networkTraffic}
        error={error.networkTraffic}
        title="Network Traffic"
        tooltip="Ingress and egress of requests and responses respectively"
        data={data.networkTraffic || []}
        renderer={NetworkTrafficRenderer}
      />
    </ReportPadding>
  )
}

ApiReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout>{page}</ReportsLayout>
  </DefaultLayout>
)

export default ApiReport

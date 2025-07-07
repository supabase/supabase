import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import {
  CacheHitRateChartRenderer,
  TopCacheMissesRenderer,
} from 'components/interfaces/Reports/renderers/StorageRenderers'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  NetworkTrafficRenderer,
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useStorageReport } from 'data/reports/storage-report-query'

import type { NextPageWithLayout } from 'types'
import Link from 'next/link'
import { ExternalLinkIcon, RefreshCw, ArrowRight } from 'lucide-react'
import { useCallback, useState } from 'react'
import dayjs from 'dayjs'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import { TIME_PERIODS_INFRA } from 'lib/constants/metrics'

export const StorageReport: NextPageWithLayout = () => {
  const report = useStorageReport()

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
      <ReportHeader title="Storage" />
      <section className="relative pt-20 -mt-2 flex flex-col gap-3">
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col gap-4">
          <div className="sticky top-0 bg dark:bg-200 pt-4 mb-4 flex flex-col items-start pointer-events-auto gap-4">
            <div className="flex items-center space-x-3">
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

        <ReportWidget
          isLoading={isLoading}
          params={params.cacheHitRate}
          title="Request Caching"
          tooltip={
            <div>
              The number of storage requests that are cached at the edge level. A higher number of
              hits is better.{' '}
              <span className="flex items-center gap-1 text-foreground-lighter">
                <Link
                  href="https://supabase.com/docs/guides/storage/cdn/fundamentals"
                  target="_blank"
                >
                  Read More
                </Link>
                <ExternalLinkIcon className="w-3 h-3" />
              </span>
            </div>
          }
          data={data.cacheHitRate || []}
          renderer={CacheHitRateChartRenderer}
          append={TopCacheMissesRenderer}
          appendProps={{ data: data.topCacheMisses || [] }}
        />
      </section>
    </ReportPadding>
  )
}

StorageReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout>{page}</ReportsLayout>
  </DefaultLayout>
)

export default StorageReport

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { createFilteredDatePickerHelpers } from 'components/interfaces/Reports/Reports.constants'
import {
  CacheHitRateChartRenderer,
  TopCacheMissesRenderer,
} from 'components/interfaces/Reports/renderers/StorageRenderers'
import { DatePickerValue } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import DefaultLayout from 'components/layouts/DefaultLayout'
import {
  NetworkTrafficRenderer,
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useStorageReport } from 'data/reports/storage-report-query'

import type { NextPageWithLayout } from 'types'
import Link from 'next/link'
import { ExternalLinkIcon } from 'lucide-react'

export const StorageReport: NextPageWithLayout = () => {
  const report = useStorageReport()
  const organization = useSelectedOrganization()

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

  const plan = organization?.plan

  const handleDatepickerChange = (vals: DatePickerValue) => {
    mergeParams({
      iso_timestamp_start: vals.from || '',
      iso_timestamp_end: vals.to || '',
    })
  }

  return (
    <ReportPadding>
      <ReportHeader title="Storage" showDatabaseSelector={false} />
      <section className="relative pt-20 -mt-2 flex flex-col gap-3">
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col gap-4">
          <div className="sticky top-0 bg dark:bg-200 pt-4 mb-4 flex flex-col items-center pointer-events-auto gap-4">
            <ReportFilterBar
              onRemoveFilters={removeFilters}
              onDatepickerChange={handleDatepickerChange}
              datepickerFrom={params.totalRequests.iso_timestamp_start}
              datepickerTo={params.totalRequests.iso_timestamp_end}
              onAddFilter={addFilter}
              onRefresh={refresh}
              isLoading={isLoading}
              filters={filters}
              selectedProduct="storage"
              datepickerHelpers={createFilteredDatePickerHelpers(plan?.id || 'free')}
              className="w-full"
              showDatabaseSelector={false}
            />
            <div className="h-px w-full">
              <ShimmerLine active={report.isLoading} />
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

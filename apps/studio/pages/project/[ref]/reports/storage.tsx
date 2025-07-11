import Link from 'next/link'
import { ExternalLinkIcon } from 'lucide-react'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
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
import { REPORT_DATERANGE_HELPER_LABELS } from 'components/interfaces/Reports/Reports.constants'
import ReportStickyNav from 'components/interfaces/Reports/ReportStickyNav'

import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { useStorageReport } from 'data/reports/storage-report-query'

import type { NextPageWithLayout } from 'types'

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

  const { datePickerHelpers, datePickerValue, handleDatePickerChange } = useReportDateRange(
    REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES
  )

  const handleDatepickerChange = (vals: DatePickerValue) => {
    // Update localStorage and hook state
    handleDatePickerChange(vals)
    // Update query params for the report
    mergeParams({
      iso_timestamp_start: vals.from || '',
      iso_timestamp_end: vals.to || '',
    })
  }

  return (
    <ReportPadding>
      <ReportHeader title="Storage" showDatabaseSelector={false} />
      <ReportStickyNav
        content={
          <>
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
              datepickerHelpers={datePickerHelpers}
              initialDatePickerValue={datePickerValue}
              className="w-full"
              showDatabaseSelector={false}
            />
          </>
        }
      >
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
      </ReportStickyNav>
    </ReportPadding>
  )
}

StorageReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout>{page}</ReportsLayout>
  </DefaultLayout>
)

export default StorageReport

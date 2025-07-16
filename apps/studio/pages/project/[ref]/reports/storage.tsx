import Link from 'next/link'
import { ArrowRight, ExternalLinkIcon, RefreshCw } from 'lucide-react'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import {
  CacheHitRateChartRenderer,
  TopCacheMissesRenderer,
} from 'components/interfaces/Reports/renderers/StorageRenderers'
import {
  DatePickerValue,
  LogsDatePicker,
} from 'components/interfaces/Settings/Logs/Logs.DatePickers'
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
import { useState } from 'react'

import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useReportDateRange } from 'hooks/misc/useReportDateRange'
import { useStorageReport } from 'data/reports/storage-report-query'
import UpgradePrompt from 'components/interfaces/Settings/Logs/UpgradePrompt'

import type { NextPageWithLayout } from 'types'
import dayjs from 'dayjs'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

export const StorageReport: NextPageWithLayout = () => {
  const report = useStorageReport()

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

  const {
    datePickerHelpers,
    datePickerValue,
    handleDatePickerChange: handleDatePickerChangeFromHook,
    showUpgradePrompt,
    setShowUpgradePrompt,
    selectedDateRange,
  } = useReportDateRange(REPORT_DATERANGE_HELPER_LABELS.LAST_60_MINUTES)

  const handleDatepickerChange = (vals: DatePickerValue) => {
    const promptShown = handleDatePickerChangeFromHook(vals)
    if (!promptShown) {
      // Update query params for the report
      mergeParams({
        iso_timestamp_start: vals.from || '',
        iso_timestamp_end: vals.to || '',
      })
    }
  }

  return (
    <ReportPadding>
      <ReportHeader title="Storage" showDatabaseSelector={false} />
      <ReportStickyNav
        content={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ButtonTooltip
                type="default"
                disabled={report.isLoading}
                icon={<RefreshCw className={report.isLoading ? 'animate-spin' : ''} />}
                className="w-7"
                tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
                onClick={() => report.refresh()}
              />
              <LogsDatePicker
                onSubmit={handleDatepickerChange}
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
              <UpgradePrompt
                show={showUpgradePrompt}
                setShowUpgradePrompt={setShowUpgradePrompt}
                title="Report date range"
                description="Report data can be stored for a maximum of 3 months depending on the plan that your project is on."
                source="storageReportDateRange"
              />
            </div>
            <ReportFilterBar
              onRemoveFilters={removeFilters}
              onDatepickerChange={handleDatepickerChange}
              datepickerFrom={params.totalRequests.iso_timestamp_start}
              datepickerTo={params.totalRequests.iso_timestamp_end}
              onAddFilter={addFilter}
              isLoading={isLoading}
              filters={filters}
              selectedProduct="storage"
              hideDatepicker={true}
              datepickerHelpers={datePickerHelpers}
              initialDatePickerValue={datePickerValue}
              className="w-full"
              showDatabaseSelector={false}
            />
          </div>
        }
      >
        <div className="mt-8 flex flex-col gap-4">
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
        </div>
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

import { useState } from 'react'

import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import {
  createFilteredDatePickerHelpers,
  REPORTS_DATEPICKER_HELPERS,
} from 'components/interfaces/Reports/Reports.constants'
import {
  CacheHitRateChartRenderer,
  TopCacheMissesRenderer,
} from 'components/interfaces/Reports/renderers/StorageRenderers'
import {
  DatePickerValue,
  LogsDatePicker,
} from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import {
  ErrorCountsChartRenderer,
  NetworkTrafficRenderer,
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import ShimmerLine from 'components/ui/ShimmerLine'
import { getStorageReportAttributes, useStorageReport } from 'data/reports/storage-report-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { RefreshCw } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import LazyComposedChartHandler, {
  MultiAttribute,
} from '../../../../components/ui/Charts/ComposedChartHandler'

export const StorageReport: NextPageWithLayout = () => {
  const report = useStorageReport()
  const organization = useSelectedOrganization()
  const { project } = useProjectContext()

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

  const defaultHelper =
    REPORTS_DATEPICKER_HELPERS.find((h) => h.default) || REPORTS_DATEPICKER_HELPERS[0]

  const [selectedRange, setSelectedRange] = useState<DatePickerValue>({
    to: defaultHelper.calcTo(),
    from: defaultHelper.calcFrom(),
    isHelper: true,
    text: defaultHelper.text,
  })

  // const updateDateRange = (from: string, to: string) => {
  //   setSelectedRange({
  //     from: { date: from, time_period: '1d' },
  //     to: { date: to, time_period: 'today' },
  //     interval: handleIntervalGranularity(from, to),
  //   })
  // }

  const datepickerHelpers = createFilteredDatePickerHelpers(plan?.id || 'free')
  const STORAGE_REPORT_ATTRIBUTES = getStorageReportAttributes(organization!, project!)

  const handleDatepickerChange = (vals: DatePickerValue) => {
    mergeParams({
      iso_timestamp_start: vals.from || '',
      iso_timestamp_end: vals.to || '',
    })
    setSelectedRange(vals)
  }

  return (
    <ReportPadding>
      <ReportHeader title="Storage" />
      <div className="w-full flex flex-col gap-1">
        <div className="flex gap-2 items-center">
          <ReportFilterBar
            onRemoveFilters={removeFilters}
            onDatepickerChange={handleDatepickerChange}
            datepickerFrom={params.totalRequests.iso_timestamp_start}
            datepickerTo={params.totalRequests.iso_timestamp_end}
            onAddFilter={addFilter}
            onRefresh={refresh}
            isLoading={isLoading}
            filters={filters}
            productFilter="storage"
            datepickerHelpers={createFilteredDatePickerHelpers(plan?.id || 'free')}
          />
          <ButtonTooltip
            type="default"
            disabled={isLoading}
            icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
            className="w-7"
            tooltip={{ content: { side: 'bottom', text: 'Refresh report' } }}
            onClick={() => refresh()}
          />

          <LogsDatePicker
            onSubmit={handleDatepickerChange}
            value={selectedRange}
            helpers={datepickerHelpers}
          />
        </div>

        <div className="h-2 w-full">
          <ShimmerLine active={report.isLoading} />
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
        tooltip="Average response speed (in miliseconds) of a request"
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
        isLoading={report.isLoading}
        params={report.params.cacheHitRate}
        title="Request Caching"
        tooltip="The number of storage requests that are cached at the edge level. A higher number of hits is better."
        data={report.data.cacheHitRate || []}
        renderer={CacheHitRateChartRenderer}
        append={TopCacheMissesRenderer}
        appendProps={{ data: report.data.topCacheMisses || [] }}
      />

      {true && (
        <div className="grid grid-cols-1 gap-4">
          {selectedRange &&
            STORAGE_REPORT_ATTRIBUTES.filter((chart) => !chart.hide).map((chart) => (
              <LazyComposedChartHandler
                key={chart.id}
                {...chart}
                attributes={chart.attributes as MultiAttribute[]}
                interval={'hour'}
                startDate={selectedRange?.from}
                endDate={selectedRange?.to}
                // updateDateRange={updateDateRange}
                defaultChartStyle={chart.defaultChartStyle as 'line' | 'bar' | 'stackedAreaLine'}
                showMaxValue={
                  chart.id === 'client-connections' || chart.id === 'pgbouncer-connections'
                    ? true
                    : chart.showMaxValue
                }
              />
            ))}
        </div>
      )}
    </ReportPadding>
  )
}

StorageReport.getLayout = (page) => (
  <DefaultLayout>
    <ReportsLayout>{page}</ReportsLayout>
  </DefaultLayout>
)

export default StorageReport

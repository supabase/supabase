import ReportFilterBar from 'components/interfaces/Reports/ReportFilterBar'
import ReportHeader from 'components/interfaces/Reports/ReportHeader'
import ReportPadding from 'components/interfaces/Reports/ReportPadding'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { REPORTS_DATEPICKER_HELPERS } from 'components/interfaces/Reports/Reports.constants'
import {
  ErrorCountsChartRenderer,
  NetworkTrafficRenderer,
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from 'components/interfaces/Reports/renderers/ApiRenderers'
import type { DatePickerToFrom } from 'components/interfaces/Settings/Logs/Logs.types'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'
import ShimmerLine from 'components/ui/ShimmerLine'
import { useApiReport } from 'data/reports/api-report-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { NextPageWithLayout } from 'types'

export const ApiReport: NextPageWithLayout = () => {
  const report = useApiReport()
  const organization = useSelectedOrganization()

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const plan = subscription?.plan

  const handleDatepickerChange = ({ from, to }: DatePickerToFrom) => {
    report.mergeParams({
      iso_timestamp_start: from || '',
      iso_timestamp_end: to || '',
    })
  }

  return (
    <ReportPadding>
      <ReportHeader title="API" />
      <div className="w-full flex flex-col gap-1">
        <ReportFilterBar
          onRemoveFilters={report.removeFilters}
          onDatepickerChange={handleDatepickerChange}
          datepickerFrom={report.params.totalRequests.iso_timestamp_start}
          datepickerTo={report.params.totalRequests.iso_timestamp_end}
          onAddFilter={report.addFilter}
          filters={report.filters}
          datepickerHelpers={REPORTS_DATEPICKER_HELPERS.map((helper, index) => ({
            ...helper,
            disabled: (index > 0 && plan?.id === 'free') || (index > 1 && plan?.id !== 'pro'),
          }))}
        />
        <div className="h-2 w-full">
          <ShimmerLine active={report.isLoading} />
        </div>
      </div>

      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.totalRequests}
        title="Total Requests"
        data={report.data.totalRequests || []}
        error={report.error.totalRequest}
        renderer={TotalRequestsChartRenderer}
        append={TopApiRoutesRenderer}
        appendProps={{ data: report.data.topRoutes || [], params: report.params.topRoutes }}
      />
      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.errorCounts}
        title="Response Errors"
        tooltip="Error responses with 4XX or 5XX status codes"
        data={report.data.errorCounts || []}
        error={report.error.errorCounts}
        renderer={ErrorCountsChartRenderer}
        appendProps={{
          data: report.data.topErrorRoutes || [],
          params: report.params.topErrorRoutes,
        }}
        append={TopApiRoutesRenderer}
      />
      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.responseSpeed}
        title="Response Speed"
        tooltip="Average response speed (in miliseconds) of a request"
        data={report.data.responseSpeed || []}
        error={report.error.responseSpeed}
        renderer={ResponseSpeedChartRenderer}
        appendProps={{ data: report.data.topSlowRoutes || [], params: report.params.topSlowRoutes }}
        append={TopApiRoutesRenderer}
      />

      <ReportWidget
        isLoading={report.isLoading}
        params={report.params.networkTraffic}
        error={report.error.networkTraffic}
        title="Network Traffic"
        tooltip="Ingress and egress of requests and responses respectively"
        data={report.data.networkTraffic || []}
        renderer={NetworkTrafficRenderer}
      />
    </ReportPadding>
  )
}

ApiReport.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default ApiReport

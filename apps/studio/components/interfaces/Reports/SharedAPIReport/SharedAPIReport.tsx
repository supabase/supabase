import ReportWidget from '../ReportWidget'
import {
  ErrorCountsChartRenderer,
  NetworkTrafficRenderer,
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from '../renderers/ApiRenderers'
import { SharedAPIReportKey } from './SharedAPIReport.constants'

type SharedAPIReportWidgetsProps = {
  data: any
  error: any
  isLoading: any
  isRefetching: boolean
  hiddenReports?: SharedAPIReportKey[]
}

export function SharedAPIReport({
  data,
  error,
  isLoading,
  isRefetching,
  hiddenReports = [],
}: SharedAPIReportWidgetsProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {!hiddenReports.includes('totalRequests') && (
        <ReportWidget
          isLoading={isLoading.totalRequests || isRefetching}
          title="Total Requests"
          data={data.totalRequests || []}
          error={error.totalRequests}
          renderer={TotalRequestsChartRenderer}
          append={TopApiRoutesRenderer}
          appendProps={{ data: data.topRoutes }}
        />
      )}
      {!hiddenReports.includes('errorCounts') && (
        <ReportWidget
          isLoading={isLoading.errorCounts || isRefetching}
          title="Response Errors"
          tooltip="Error responses with 4XX or 5XX status codes"
          data={data.errorCounts || []}
          error={error.errorCounts}
          renderer={ErrorCountsChartRenderer}
          appendProps={{
            data: data.topErrorRoutes || [],
          }}
          append={TopApiRoutesRenderer}
        />
      )}
      {!hiddenReports.includes('responseSpeed') && (
        <ReportWidget
          isLoading={isLoading.responseSpeed || isRefetching}
          title="Response Speed"
          tooltip="Average response speed of a request (in ms)"
          data={data.responseSpeed || []}
          error={error.responseSpeed}
          renderer={ResponseSpeedChartRenderer}
          appendProps={{ data: data.topSlowRoutes || [] }}
          append={TopApiRoutesRenderer}
        />
      )}
      {!hiddenReports.includes('networkTraffic') && (
        <ReportWidget
          isLoading={isLoading.networkTraffic || isRefetching}
          error={error.networkTraffic}
          title="Network Traffic"
          tooltip="Ingress and egress of requests and responses respectively"
          data={data.networkTraffic || []}
          renderer={NetworkTrafficRenderer}
        />
      )}
    </div>
  )
}

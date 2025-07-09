import ReportWidget from './ReportWidget'
import {
  ErrorCountsChartRenderer,
  NetworkTrafficRenderer,
  ResponseSpeedChartRenderer,
  TopApiRoutesRenderer,
  TotalRequestsChartRenderer,
} from './renderers/ApiRenderers'
import { SharedAPIReportKey, useSharedAPIReport } from './SharedAPIReport.constants'
import { useParams } from 'common'

export function SharedAPIReport({
  filterBy,
  start,
  end,
  hiddenReports = [],
}: {
  filterBy: 'auth' | 'realtime' | 'storage' | 'graphql' | 'functions'
  start: string
  end: string
  hiddenReports?: SharedAPIReportKey[]
}) {
  const { ref } = useParams() as { ref: string }

  const { data, error, isLoading } = useSharedAPIReport({
    src: filterBy === 'functions' ? 'function_edge_logs' : 'edge_logs',
    filters: [
      {
        key: 'request.path',
        value: `/${filterBy}`,
        compare: 'matches',
      },
    ],
    start,
    end,
    projectRef: ref,
    enabled: !!ref && !!filterBy,
  })

  return (
    <div className="grid grid-cols-1 gap-4">
      {!hiddenReports.includes('totalRequests') && (
        <ReportWidget
          isLoading={isLoading.totalRequests}
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
          isLoading={isLoading.errorCounts}
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
          isLoading={isLoading.responseSpeed}
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
          isLoading={isLoading.networkTraffic}
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

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

type SharedAPIReportFilterBy =
  | 'auth'
  | 'realtime'
  | 'storage'
  | 'graphql'
  | 'functions'
  | 'postgrest'
export function SharedAPIReport({
  filterBy,
  start,
  end,
  hiddenReports = [],
}: {
  filterBy: SharedAPIReportFilterBy
  start: string
  end: string
  hiddenReports?: SharedAPIReportKey[]
}) {
  const { ref } = useParams() as { ref: string }

  // [Jordi] Source to fetch the data from
  const filterByMapSource: Record<SharedAPIReportFilterBy, string> = {
    functions: 'function_edge_logs',
    realtime: 'edge_logs',
    storage: 'edge_logs',
    graphql: 'edge_logs',
    postgrest: 'edge_logs',
    auth: 'edge_logs',
  }

  // [Jordi] Value to match in the request.path
  const filterByMapValue: Record<SharedAPIReportFilterBy, string> = {
    functions: '/functions',
    realtime: '/realtime',
    storage: '/storage',
    graphql: '/graphql',
    postgrest: '/rest',
    auth: '/auth',
  }

  const { data, error, isLoading } = useSharedAPIReport({
    src: filterByMapSource[filterBy],
    filters: [
      {
        key: 'request.path',
        value: filterByMapValue[filterBy],
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

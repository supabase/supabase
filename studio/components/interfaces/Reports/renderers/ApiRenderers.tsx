import { ReportWidgetProps, ReportWidgetRendererProps } from '../ReportWidget'
import BarChart from 'components/ui/Charts/BarChart'
import Table from 'components/to-be-cleaned/Table'
import {
  jsonSyntaxHighlight,
  ResponseCodeFormatter,
  TextFormatter,
} from 'components/interfaces/Settings/Logs/LogsFormatters'
import { Button, Collapsible, IconChevronRight } from 'ui'
import { queryParamsToObject } from '../Reports.utils'
import Loading from 'components/ui/Loading'
import { LoadingLine } from 'ui/src/components/Command/LoadingLine'
import LoadingOpacity from 'components/ui/LoadingOpacity'

export const renderTotalRequests = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + datum.count
  }, 0)
  return (
    <BarChart
      size="small"
      minimalHeader
      highlightedValue={total}
      className="w-full"
      data={props.data}
      yAxisKey="count"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const renderTopApiRoutes = (
  props: ReportWidgetRendererProps<{
    method: string
    // shown for error table but not all requests table
    status_code?: number
    path: string
    search: string
    count: number
  }>
) => {
  if (props.data.length === 0) return null
  const headerClasses = '!text-xs !py-2 p-0 font-bold !bg-scale-400'
  const cellClasses = '!text-xs !py-2'
  return (
    <Table
      head={
        <>
          <Table.th className={headerClasses}>Request</Table.th>
          <Table.th className={headerClasses + ' text-right'}>Count</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((datum) => (
            <>
              <Table.tr className="p-0">
                <Table.td className={[cellClasses].join(' ')}>
                  <RouteTdContent {...datum} />
                </Table.td>
                <Table.td className={[cellClasses, 'text-right align-top'].join(' ')}>
                  {datum.count}
                </Table.td>
              </Table.tr>
            </>
          ))}
        </>
      }
    />
  )
}

export const renderErrorCounts = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + datum.count
  }, 0)
  return (
    <BarChart
      size="small"
      minimalHeader
      className="w-full"
      highlightedValue={total}
      data={props.data}
      yAxisKey="count"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const renderResponseSpeed = (
  props: ReportWidgetProps<{
    timestamp: string
    avg: number
    quantiles: number[]
  }>
) => {
  const transformedData = props.data.map((datum) => ({
    timestamp: datum.timestamp,
    avg: datum.avg,
    median: datum.quantiles[49],
  }))
  const lastAvg = props.data[props.data.length - 1]?.avg
  return (
    <BarChart
      size="small"
      highlightedValue={lastAvg}
      format="ms"
      minimalHeader
      className="w-full"
      data={transformedData}
      yAxisKey="avg"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

interface RouteTdContentProps {
  method: string
  status_code?: number
  path: string
  search: string
}
const RouteTdContent = (datum: RouteTdContentProps) => (
  <Collapsible>
    <Collapsible.Trigger asChild>
      <div className="flex gap-2">
        <Button type="text" className=" !py-0 !p-1" title="Show more route details">
          <IconChevronRight
            size={14}
            className="transition data-open-parent:rotate-90 data-closed-parent:rotate-0"
          />
        </Button>
        <TextFormatter className="w-10 h-4 text-center rounded bg-scale-500" value={datum.method} />
        {datum.status_code && (
          <TextFormatter
            className={`w-10 h-4 text-center rounded ${
              datum.status_code >= 400
                ? 'bg-orange-500'
                : datum.status_code >= 300
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            value={String(datum.status_code)}
          />
        )}
        <div className=" truncate max-w-sm lg:max-w-lg">
          <TextFormatter className="text-scale-1100" value={datum.path} />
          <TextFormatter
            className="max-w-sm text-scale-900 truncate "
            value={decodeURIComponent(datum.search || '')}
          />
        </div>
      </div>
    </Collapsible.Trigger>
    <Collapsible.Content className="pt-2">
      <pre className={`syntax-highlight overflow-auto rounded bg-scale-300 p-2 !text-xs`}>
        <div
          className="text-wrap"
          dangerouslySetInnerHTML={{
            __html: jsonSyntaxHighlight(queryParamsToObject(datum.search)),
          }}
        />
      </pre>
    </Collapsible.Content>
  </Collapsible>
)

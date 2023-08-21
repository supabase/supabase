import { ReportWidgetProps, ReportWidgetRendererProps } from '../ReportWidget'
import BarChart from 'components/ui/Charts/BarChart'
import Table from 'components/to-be-cleaned/Table'
import {
  jsonSyntaxHighlight,
  TextFormatter,
} from 'components/interfaces/Settings/Logs/LogsFormatters'
import { Button, Collapsible, IconChevronRight } from 'ui'
import { queryParamsToObject } from '../Reports.utils'
import { Fragment } from 'react'
import useFillTimeseriesSorted from 'hooks/analytics/useFillTimeseriesSorted'
import sumBy from 'lodash/sumBy'

export const NetworkTrafficRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    ingress: number
    egress: number
  }>
) => {
  const data = useFillTimeseriesSorted(
    props.data,
    'timestamp',
    ['ingress_mb', 'egress_mb'],
    0,
    props.params?.iso_timestamp_start,
    props.params?.iso_timestamp_end
  )
  const totalIngress = sumBy(props.data, 'ingress_mb')
  const totalEgress = sumBy(props.data, 'egress_mb')

  function determinePrecision(valueInMb: number) {
    return valueInMb < 0.001 ? 7 : totalIngress > 1 ? 2 : 4
  }
  return (
    <div className="flex flex-col gap-2 w-full">
      <BarChart
        size="small"
        title="Ingress"
        highlightedValue={sumBy(props.data, 'ingress_mb')}
        format="MB"
        className="w-full"
        valuePrecision={determinePrecision(totalIngress)}
        data={data}
        yAxisKey="ingress_mb"
        xAxisKey="timestamp"
        displayDateInUtc
      />

      <BarChart
        size="small"
        title="Egress"
        highlightedValue={totalEgress}
        format="MB"
        valuePrecision={determinePrecision(totalEgress)}
        className="w-full"
        data={data}
        yAxisKey="egress_mb"
        xAxisKey="timestamp"
        displayDateInUtc
      />
    </div>
  )
}
export const TotalRequestsChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + datum.count
  }, 0)
  const data = useFillTimeseriesSorted(
    props.data,
    'timestamp',
    'count',
    0,
    props.params?.iso_timestamp_start,
    props.params?.iso_timestamp_end
  )
  return (
    <BarChart
      size="small"
      minimalHeader
      highlightedValue={total}
      className="w-full"
      data={data}
      yAxisKey="count"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const TopApiRoutesRenderer = (
  props: ReportWidgetRendererProps<{
    method: string
    // shown for error table but not all requests table
    status_code?: number
    path: string
    search: string
    count: number
    // used for response speed table only
    avg?: number
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
          {props.data[0].avg !== undefined && (
            <Table.th className={headerClasses + ' text-right'}>Avg</Table.th>
          )}
        </>
      }
      body={
        <>
          {props.data.map((datum) => (
            <Fragment key={datum.path + (datum.search || '')}>
              <Table.tr className="p-0">
                <Table.td className={[cellClasses].join(' ')}>
                  <RouteTdContent {...datum} />
                </Table.td>
                <Table.td className={[cellClasses, 'text-right align-top'].join(' ')}>
                  {datum.count}
                </Table.td>
                {props.data[0].avg !== undefined && (
                  <Table.td className={[cellClasses, 'text-right align-top'].join(' ')}>
                    {Number(datum.avg).toFixed(2)}ms
                  </Table.td>
                )}
              </Table.tr>
            </Fragment>
          ))}
        </>
      }
    />
  )
}

export const ErrorCountsChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const total = props.data.reduce((acc, datum) => {
    return acc + datum.count
  }, 0)

  const data = useFillTimeseriesSorted(
    props.data,
    'timestamp',
    'count',
    0,
    props.params?.iso_timestamp_start,
    props.params?.iso_timestamp_end
  )

  return (
    <BarChart
      size="small"
      minimalHeader
      className="w-full"
      highlightedValue={total}
      data={data}
      yAxisKey="count"
      xAxisKey="timestamp"
      displayDateInUtc
    />
  )
}

export const ResponseSpeedChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    avg: number
  }>
) => {
  const transformedData = props.data.map((datum) => ({
    timestamp: datum.timestamp,
    avg: datum.avg,
  }))

  const data = useFillTimeseriesSorted(
    transformedData,
    'timestamp',
    'avg',
    0,
    props.params?.iso_timestamp_start,
    props.params?.iso_timestamp_end
  )

  const lastAvg = props.data[props.data.length - 1]?.avg
  return (
    <BarChart
      size="small"
      highlightedValue={lastAvg}
      format="ms"
      minimalHeader
      className="w-full"
      data={data}
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
        <Button asChild type="text" className=" !py-0 !p-1" title="Show more route details">
          <span>
            <IconChevronRight
              size={14}
              className="transition data-open-parent:rotate-90 data-closed-parent:rotate-0"
            />
          </span>
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
      {datum.search ? (
        <pre className={`syntax-highlight overflow-auto rounded bg-scale-300 p-2 !text-xs`}>
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: jsonSyntaxHighlight(queryParamsToObject(datum.search)),
            }}
          />
        </pre>
      ) : (
        <p className="text-xs text-scale-900">No query parameters in this request</p>
      )}
    </Collapsible.Content>
  </Collapsible>
)

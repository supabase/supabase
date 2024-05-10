import sumBy from 'lodash/sumBy'
import { Fragment, useState } from 'react'
import { ChevronRight } from 'lucide-react'

import { useParams } from 'common'
import {
  jsonSyntaxHighlight,
  TextFormatter,
} from 'components/interfaces/Settings/Logs/LogsFormatters'
import Table from 'components/to-be-cleaned/Table'
import BarChart from 'components/ui/Charts/BarChart'
import useFillTimeseriesSorted from 'hooks/analytics/useFillTimeseriesSorted'
import { Button, Collapsible } from 'ui'
import { queryParamsToObject } from '../Reports.utils'
import { ReportWidgetProps, ReportWidgetRendererProps } from '../ReportWidget'

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
  const { ref: projectRef } = useParams()
  const [showMore, setShowMore] = useState(false)

  const headerClasses = '!text-xs !py-2 p-0 font-bold !bg-surface-200 !border-x-0 !rounded-none'
  const cellClasses = '!text-xs !py-2 !border-x-0 !rounded-none align-middle'

  if (props.data.length === 0) return null

  return (
    <Collapsible>
      <Table
        className="rounded-t-none"
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
            {props.data.map((datum, index) => (
              <Fragment key={datum.method + datum.path + (datum.search || '')}>
                <Table.tr
                  className={[
                    'p-0 transition transform cursor-pointer hover:bg-surface-200',
                    showMore && index >= 3 ? 'w-full h-full opacity-100' : '',
                    !showMore && index >= 3 ? ' w-0 h-0 translate-y-10 opacity-0' : '',
                  ].join(' ')}
                >
                  {(!showMore && index < 3) || showMore ? (
                    <>
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
                    </>
                  ) : null}
                </Table.tr>
              </Fragment>
            ))}
          </>
        }
      />
      <Collapsible.Trigger asChild>
        <div className="flex flex-row justify-end w-full gap-2 p-1">
          <Button
            type="text"
            onClick={() => setShowMore(!showMore)}
            className={[
              'transition',
              showMore ? 'text-foreground' : 'text-foreground-lighter',
              props.data.length <= 3 ? 'hidden' : '',
            ].join(' ')}
          >
            {!showMore ? 'Show more' : 'Show less'}
          </Button>
          <Button
            type="text"
            className="text-foreground-lighter"
            onClick={() => {
              props.router.push({
                pathname: `/project/${projectRef}/logs/explorer`,
                query: {
                  q: props.params?.sql,
                  its: props.params!.iso_timestamp_start,
                  ite: props.params!.iso_timestamp_end,
                },
              })
            }}
          >
            Open in Logs Explorer
          </Button>
        </div>
      </Collapsible.Trigger>
    </Collapsible>
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
      <div className="flex gap-2 items-center">
        <Button asChild type="text" className=" !py-0 !p-1" title="Show more route details">
          <span>
            <ChevronRight
              size={14}
              className="transition data-open-parent:rotate-90 data-closed-parent:rotate-0"
            />
          </span>
        </Button>
        <TextFormatter
          className="w-10 h-4 text-center rounded bg-surface-300"
          value={datum.method}
        />
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
          <TextFormatter className="text-foreground-light" value={datum.path} />
          <TextFormatter
            className="max-w-sm text-foreground-lighter truncate "
            value={decodeURIComponent(datum.search || '')}
          />
        </div>
      </div>
    </Collapsible.Trigger>
    <Collapsible.Content className="pt-2">
      {datum.search ? (
        <pre className={`syntax-highlight overflow-auto rounded bg-surface-100 p-2 !text-xs`}>
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: jsonSyntaxHighlight(queryParamsToObject(datum.search)),
            }}
          />
        </pre>
      ) : (
        <p className="text-xs text-foreground-lighter">No query parameters in this request</p>
      )}
    </Collapsible.Content>
  </Collapsible>
)

import { Button, IconChevronRight } from 'ui'
import { jsonSyntaxHighlight } from 'components/interfaces/Settings/Logs/LogsFormatters'
import { BarChart } from 'components/to-be-cleaned/Charts/ChartRenderer'
import Table from 'components/to-be-cleaned/Table'
import { USAGE_COLORS } from 'components/ui/Charts/Charts.constants'
import StackedAreaChart from 'components/ui/Charts/StackedAreaChart'
import { useState } from 'react'
import { DATETIME_FORMAT } from '../Reports.constants'
import { PathsDatum, StatusCodesDatum } from '../Reports.types'
import { queryParamsToObject } from '../Reports.utils'
import { ReportWidgetProps } from '../ReportWidget'

export const renderUserAgents = (
  props: ReportWidgetProps<{
    user_agent: string
    request_source: string
    count: number
  }>
) => {
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">User Agents</Table.th>
          <Table.th className="sticky top-0 z-10">Request Source</Table.th>
          <Table.th className="sticky top-0 z-10">Count</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => {
            return (
              <Table.tr key={index}>
                <Table.td className="max-w-sm lg:max-w-lg" style={{ padding: '0.3rem' }}>
                  {row.user_agent ? (
                    row.user_agent
                  ) : (
                    <span className="text-scale-1000">No user agent</span>
                  )}
                </Table.td>
                <Table.td>{row.request_source}</Table.td>
                <Table.td style={{ padding: '0.5rem' }} className="align-top text-xs">
                  {row.count}
                </Table.td>
              </Table.tr>
            )
          })}
        </>
      }
    />
  )
}

export const renderBotScores = (
  props: ReportWidgetProps<{
    ip: string
    country: string
    user_agent: string
    path: string
    bot_score: number
    bot_verified: boolean
    count: number
  }>
) => {
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">IP (Country)</Table.th>
          <Table.th className="sticky top-0 z-10">Request Path</Table.th>
          <Table.th className="sticky top-0 z-10">User Agent</Table.th>
          <Table.th className="sticky top-0 z-10">Bot Score</Table.th>
          <Table.th className="sticky top-0 z-10">Is Verified Bot</Table.th>
          <Table.th className="sticky top-0 z-10">Count</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row, index) => {
            return (
              <Table.tr key={index}>
                <Table.td className="max-w-sm lg:max-w-lg" style={{ padding: '0.3rem' }}>
                  {row.ip} ({row.country})
                </Table.td>
                <Table.td>{row.path}</Table.td>
                <Table.td className="max-w-xs truncate">{row.user_agent}</Table.td>
                <Table.td>{row.bot_score}</Table.td>
                <Table.td>{row.bot_verified ? 'Yes' : 'No'}</Table.td>
                <Table.td style={{ padding: '0.5rem' }} className="align-top text-xs">
                  {row.count}
                </Table.td>
              </Table.tr>
            )
          })}
        </>
      }
    />
  )
}

export const renderStatusCodesChart = (props: ReportWidgetProps<StatusCodesDatum>) => (
  <StackedAreaChart
    dateFormat={DATETIME_FORMAT}
    data={props.data}
    stackKey="status_code"
    xAxisKey="timestamp"
    yAxisKey="count"
    isLoading={false}
    xAxisFormatAsDate
    size="large"
    styleMap={{
      200: { stroke: USAGE_COLORS['200'], fill: USAGE_COLORS['200'] },
      201: { stroke: USAGE_COLORS['201'], fill: USAGE_COLORS['201'] },
      400: { stroke: USAGE_COLORS['400'], fill: USAGE_COLORS['400'] },
      401: { stroke: USAGE_COLORS['401'], fill: USAGE_COLORS['401'] },
      404: { stroke: USAGE_COLORS['404'], fill: USAGE_COLORS['404'] },
      500: { stroke: USAGE_COLORS['500'], fill: USAGE_COLORS['500'] },
    }}
  />
)
export const renderErrorRateChart = (props: ReportWidgetProps) => {
  return (
    <div className="flex w-full flex-col">
      <BarChart
        data={props.data}
        attribute="count"
        label=""
        minimalHeader
        customDateFormat={DATETIME_FORMAT}
        noDataMessage={'No errors yet'}
      />
    </div>
  )
}

export const renderRequestsPathsTable = (props: ReportWidgetProps<PathsDatum>) => {
  const transformedData = props.data.map((data: PathsDatum) => ({
    ...data,
    p99_time: data.quantiles[98],
  }))
  const requestPathsSums = transformedData.map((v) => v.sum) as number[]
  const requestPathsSumMax = Math.max(...requestPathsSums)
  const requestPathsSumMin = Math.min(...requestPathsSums)
  const requestPathsAvgs = transformedData.map((v) => v.avg_origin_time) as number[]
  const requestPathsAvgMax = Math.max(...requestPathsAvgs)
  const requestPathsAvgMin = Math.min(...requestPathsAvgs)
  const requestPathsP99s = transformedData.map((v) => v.p99_time) as number[]
  const requestPathsP99Max = Math.max(...requestPathsP99s)
  const requestPathsP99Min = Math.min(...requestPathsP99s)

  const renderNumericCellWithColorScale = (value: number, percentage: number) => (
    <Table.td
      style={{
        padding: '0.5rem',
      }}
      className={`${
        percentage >= 80
          ? 'bg-orange-600'
          : percentage > 60
          ? 'bg-orange-500'
          : percentage > 40
          ? 'bg-yellow-500'
          : percentage > 20
          ? 'bg-yellow-400'
          : percentage > 10
          ? 'bg-yellow-200'
          : 'bg-green-100'
      } align-top text-xs`}
    >
      <span className="text-scale-1100">{Number(value).toFixed(1)}</span>
    </Table.td>
  )
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="relative rounded border border-scale-600"
      head={
        <>
          <Table.th className="sticky top-0 z-10">Path</Table.th>
          <Table.th className="sticky top-0 z-10">Count</Table.th>
          <Table.th className="sticky top-0 z-10">Avg. Time (ms)</Table.th>
          <Table.th className="sticky top-0 z-10">p99 Time (ms)</Table.th>
          <Table.th className="sticky top-0 z-10">Total Query Time</Table.th>
        </>
      }
      body={
        <>
          {transformedData.map((row, index) => {
            const [show, setShow] = useState(false)

            const totalQueryTimePercentage =
              ((row.sum - requestPathsSumMin) / requestPathsSumMax) * 100
            const avgTimePercentage =
              ((row.avg_origin_time - requestPathsAvgMin) / requestPathsAvgMax) * 100
            const p99TimePercentage =
              ((row.p99_time - requestPathsP99Min) / requestPathsP99Max) * 100
            return (
              <>
                <Table.tr key={index}>
                  <Table.td className="max-w-sm lg:max-w-lg" style={{ padding: '0.3rem' }}>
                    <Button
                      onClick={() => setShow(!show)}
                      type="text"
                      className="flex w-full justify-start space-x-1 text-scale-1200"
                      icon={
                        <span className={`transition ${show ? 'rotate-90' : 'rotate-0'}`}>
                          <IconChevronRight size="tiny" />
                        </span>
                      }
                    >
                      <div className="overflow-x-none flex items-center space-x-2">
                        <p className="font-mono text-xs text-scale-1200">{row.method}</p>
                        <p className="max-w-xs truncate font-mono text-xs text-scale-1200 ">
                          {row.path}
                          <span className="text-scale-1000">{row.query_params}</span>
                        </p>
                      </div>
                    </Button>
                  </Table.td>
                  <Table.td style={{ padding: '0.5rem' }} className="align-top text-xs">
                    {row.count}
                  </Table.td>
                  {renderNumericCellWithColorScale(row.avg_origin_time, avgTimePercentage)}
                  {renderNumericCellWithColorScale(row.p99_time, p99TimePercentage)}
                  <Table.td className="py-1 align-top">
                    <div
                      className={`mt-1 h-2 w-full rounded bg-green-1100`}
                      style={{
                        width: `${totalQueryTimePercentage}%`,
                      }}
                    />
                  </Table.td>
                </Table.tr>
                <Table.tr className="transition-all duration-500">
                  <Table.td
                    colSpan={4}
                    className={`overflow-none w-full ${
                      show ? 'h-auto opacity-100' : 'table-cell !h-0 !p-0 opacity-0'
                    }`}
                  >
                    <pre
                      className={`syntax-highlight max-w-lg overflow-auto rounded bg-scale-300 p-2 text-xs  ${
                        show ? '' : 'h-0 !p-0'
                      }`}
                    >
                      <div
                        className="text-wrap"
                        dangerouslySetInnerHTML={{
                          __html: jsonSyntaxHighlight(queryParamsToObject(row.query_params)),
                        }}
                      />
                    </pre>
                  </Table.td>
                </Table.tr>
              </>
            )
          })}
        </>
      }
    />
  )
}

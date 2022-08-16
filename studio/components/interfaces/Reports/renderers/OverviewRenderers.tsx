import { Collapsible, IconChevronRight } from '@supabase/ui'
import { jsonSyntaxHighlight } from 'components/interfaces/Settings/Logs/LogsFormatters'
import Table from 'components/to-be-cleaned/Table'
import { USAGE_COLORS } from 'components/ui/Charts/Charts.constants'
import StackedAreaChart from 'components/ui/Charts/StackedAreaChart'
import { DATETIME_FORMAT } from '../Reports.constants'
import { PathsDatum, StatusCodesDatum } from '../Reports.types'
import { queryParamsToObject } from '../Reports.utils'
import { ReportWidgetProps } from '../ReportWidget'

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

export const renderRequestsPathsTable = (props: ReportWidgetProps<PathsDatum>) => {
  const requestPathsSums = props.data.map((v) => v.sum) as number[]
  const requestPathsSumMax = Math.max(...requestPathsSums)
  const requestPathsSumMin = Math.min(...requestPathsSums)
  return (
    <Table
      containerClassName="max-h-72 w-full overflow-y-auto"
      className="border border-scale-600 relative rounded"
      head={
        <>
          <Table.th className="sticky top-0 z-10">Path</Table.th>
          <Table.th className="sticky top-0 z-10">Count</Table.th>
          <Table.th className="sticky top-0 z-10">Avg. Time (ms)</Table.th>
          <Table.th className="sticky top-0 z-10">Total Query Time</Table.th>
        </>
      }
      body={
        <>
          {props.data.map((row: any, index) => {
            const totalQueryTimePercentage =
              ((row.sum - requestPathsSumMin) / requestPathsSumMax) * 100
            return (
              <Table.tr key={index}>
                <Table.td className="max-w-sm lg:max-w-lg" style={{ padding: '0.3rem' }}>
                  <Collapsible className="w-full flex flex-col gap-2">
                    <Collapsible.Trigger asChild>
                      <button
                        className="w-full text-scale-1200 flex justify-start space-x-1"
                        type="button"
                      >
                        <IconChevronRight
                          size="tiny"
                          className="transition data-open-parent:rotate-90 data-closed-parent:rotate-0"
                        />
                        <div className="flex space-x-2 items-center overflow-x-none">
                          <p className="text-scale-1200 font-mono text-xs">{row.method}</p>
                          <p className="font-mono text-scale-1200 text-xs truncate max-w-xs ">
                            {row.path}
                            <span className="text-scale-1000">{row.query_params}</span>
                          </p>
                        </div>
                      </button>
                    </Collapsible.Trigger>
                    <Collapsible.Content className="bg-scale-300 p-2 rounded">
                      <pre className="text-xs syntax-highlight overflow-x-auto">
                        <div
                          className="text-wrap"
                          dangerouslySetInnerHTML={{
                            __html: jsonSyntaxHighlight(queryParamsToObject(row.query_params)),
                          }}
                        />
                      </pre>
                    </Collapsible.Content>
                  </Collapsible>
                </Table.td>
                <Table.td style={{ padding: '0.5rem' }} className="text-xs align-top">
                  {row.count}
                </Table.td>
                <Table.td style={{ padding: '0.5rem' }} className="text-xs align-top">
                  {Number(row.avg_origin_time).toFixed(2)}
                </Table.td>
                <Table.td className="align-top py-1">
                  <div
                    className={`mt-1 h-2 rounded w-full bg-green-1100`}
                    style={{
                      width: `${totalQueryTimePercentage}%`,
                    }}
                  />
                </Table.td>
              </Table.tr>
            )
          })}
        </>
      }
    />
  )
}

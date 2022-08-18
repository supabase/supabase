import { Button, IconChevronRight } from '@supabase/ui'
import { jsonSyntaxHighlight } from 'components/interfaces/Settings/Logs/LogsFormatters'
import Table from 'components/to-be-cleaned/Table'
import { USAGE_COLORS } from 'components/ui/Charts/Charts.constants'
import StackedAreaChart from 'components/ui/Charts/StackedAreaChart'
import { useState } from 'react'
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
  const requestPathsAvgs = props.data.map((v) => v.avg_origin_time) as number[]
  const requestPathsAvgMax = Math.max(...requestPathsAvgs)
  const requestPathsAvgMin = Math.min(...requestPathsAvgs)

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
          {props.data.map((row: PathsDatum, index) => {
            const [show, setShow] = useState(false)

            const totalQueryTimePercentage =
              ((row.sum - requestPathsSumMin) / requestPathsSumMax) * 100
            const avgTimePercentage =
              ((row.avg_origin_time - requestPathsAvgMin) / requestPathsAvgMax) * 100
            return (
              <>
                <Table.tr key={index}>
                  <Table.td className="max-w-sm lg:max-w-lg" style={{ padding: '0.3rem' }}>
                    <Button
                      onClick={() => setShow(!show)}
                      type="text"
                      className="w-full text-scale-1200 justify-start space-x-1 flex"
                      icon={
                        <span className={`transition ${show ? 'rotate-90' : 'rotate-0'}`}>
                          <IconChevronRight size="tiny" />
                        </span>
                      }
                    >
                      <div className="flex space-x-2 items-center overflow-x-none">
                        <p className="text-scale-1200 font-mono text-xs">{row.method}</p>
                        <p className="font-mono text-scale-1200 text-xs truncate max-w-xs ">
                          {row.path}
                          <span className="text-scale-1000">{row.query_params}</span>
                        </p>
                      </div>
                    </Button>
                  </Table.td>
                  <Table.td style={{ padding: '0.5rem' }} className="text-xs align-top">
                    {row.count}
                  </Table.td>
                  <Table.td
                    style={{
                      padding: '0.5rem',
                    }}
                    className={`${
                      avgTimePercentage >= 80
                        ? 'bg-orange-600'
                        : avgTimePercentage > 60
                        ? 'bg-orange-500'
                        : avgTimePercentage > 40
                        ? 'bg-yellow-500'
                        : avgTimePercentage > 20
                        ? 'bg-yellow-400'
                        : avgTimePercentage > 10
                        ? 'bg-yellow-200'
                        : 'bg-green-100'
                    } text-xs align-top`}
                  >
                    <span className="text-scale-1100">
                      {Number(row.avg_origin_time).toFixed(2)}
                    </span>
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
                <Table.tr className="transition-all duration-500">
                  <Table.td
                    colSpan={4}
                    className={`w-full overflow-none ${
                      show ? 'h-auto opacity-100' : 'table-cell !h-0 !p-0 opacity-0'
                    }`}
                  >
                    <pre
                      className={`max-w-lg text-xs syntax-highlight overflow-auto bg-scale-300 p-2 rounded  ${
                        show ? '' : '!p-0 h-0'
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

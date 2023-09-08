import { TextFormatter } from 'components/interfaces/Settings/Logs/LogsFormatters'
import Table from 'components/to-be-cleaned/Table'
import StackedBarChart from 'components/ui/Charts/StackedBarChart'
import { Fragment } from 'react'
import { ReportWidgetProps, ReportWidgetRendererProps } from '../ReportWidget'

export const CacheHitRateChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    hit_count: number
    miss_count: number
  }>
) => {
  const stackedData = props.data.flatMap((datum) => [
    {
      timestamp: datum.timestamp,
      count: datum.hit_count,
      type: 'hit',
    },
    {
      timestamp: datum.timestamp,
      count: datum.miss_count,
      type: 'miss',
    },
  ])

  return (
    <StackedBarChart
      hideHeader
      variant="percentages"
      data={stackedData}
      xAxisKey="timestamp"
      yAxisKey="count"
      stackKey="type"
      stackColors={['brand', 'amber']}
    />
  )
}

export const TopCacheMissesRenderer = (
  props: ReportWidgetRendererProps<{
    path: string
    search: string
    count: number
  }>
) => {
  if (props.data.length === 0) return null
  const headerClasses = '!text-xs !py-2 p-0 font-bold !bg-scale-400'
  const cellClasses = '!text-xs !py-2'

  return (
    <>
      <h4>Top Cache Misses</h4>
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
              <Fragment key={datum.path + (datum.search || '')}>
                <Table.tr className="p-0">
                  <Table.td className={[cellClasses].join(' ')}>
                    <div className=" truncate max-w-sm lg:max-w-lg">
                      <TextFormatter className="text-scale-1100" value={datum.path} />
                      <TextFormatter
                        className="max-w-sm text-scale-900 truncate "
                        value={decodeURIComponent(datum.search || '')}
                      />
                    </div>
                  </Table.td>
                  <Table.td className={[cellClasses, 'text-right align-top'].join(' ')}>
                    {datum.count}
                  </Table.td>
                </Table.tr>
              </Fragment>
            ))}
          </>
        }
      />
    </>
  )
}

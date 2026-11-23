import { useFlag } from 'common'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { safeDecodeURIComponent } from '../Reports.utils'
import { ReportWidgetProps, ReportWidgetRendererProps } from '../ReportWidget'
import { TextFormatter } from '@/components/interfaces/Settings/Logs/LogsFormatters'
import StackedBarChart from '@/components/ui/Charts/StackedBarChart'

export const CacheHitRateChartRenderer = (
  props: ReportWidgetProps<{
    timestamp: string
    hit_count: number
    miss_count: number
  }>
) => {
  const shouldDefaultToLineCharts = useFlag('defaultToLineCharts')
  const stackedData = props.data.flatMap((datum) => [
    {
      timestamp: +datum.timestamp / 1000,
      count: datum.hit_count,
      type: 'hit',
    },
    {
      timestamp: +datum.timestamp / 1000,
      count: datum.miss_count,
      type: 'miss',
    },
  ])

  return (
    <StackedBarChart
      chartStyle={shouldDefaultToLineCharts ? 'line' : 'bar'}
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
  const cellClasses = 'text-xs py-2'

  return (
    <>
      <h3 className="py-4 px-6">Top Cache Misses</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request</TableHead>
            <TableHead className="text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.data.map((datum) => (
            <TableRow key={datum.path + (datum.search || '')}>
              <TableCell className={cellClasses}>
                <div className=" truncate max-w-sm lg:max-w-lg">
                  <TextFormatter className="text-foreground-light" value={datum.path} />
                  <TextFormatter
                    className="max-w-sm text-foreground-lighter truncate "
                    value={safeDecodeURIComponent(datum.search || '')}
                  />
                </div>
              </TableCell>
              <TableCell className={`${cellClasses} text-right`}>{datum.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

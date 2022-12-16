import { BarChart } from 'components/to-be-cleaned/Charts/ChartRenderer'
import StackedBarChart from 'components/ui/Charts/StackedBarChart'
import { DATETIME_FORMAT } from '../Reports.constants'
import { ReportWidgetProps } from '../ReportWidget'
import Statistic from '../Statistic'

export const renderBannedUsers = (
  props: ReportWidgetProps<{
    count: number
  }>
) => {
  const count = props.data.length === 0 ? 0 : props?.data?.[0]?.count
  return <Statistic value={count} />
}
export const renderUnverifiedUsers = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const count = props.data.length === 0 ? 0 : props?.data?.[0]?.count

  return (
    <Statistic
      value={count}
      sparklineData={props.data.length >= 3 ? props.data : null}
      sparklineXAxis="timestamp"
      sparklineYAxis="count"
    />
  )
}
export const renderSignUpProviders = (
  props: ReportWidgetProps<{
    timestamp: string
    provider: string
    count: number
  }>
) => {
  return (
    <StackedBarChart
      hideHeader
      variant="percentages"
      data={props.data}
      xAxisKey="timestamp"
      yAxisKey="count"
      stackKey="provider"
    />
  )
}
export const renderFailedMigrations = (
  props: ReportWidgetProps<{
    timestamp: string
    count: number
  }>
) => {
  const count = props.data.length === 0 ? 0 : props?.data?.[0]?.count
  return <Statistic value={count} />
}
export const renderCumulativeUsers = (
  props: ReportWidgetProps<{
    count: number
    timestamp: string
  }>
) => {
  const total = props.data?.[0]?.count
  return (
    <div className="flex w-full flex-col">
      <BarChart
        data={props.data}
        attribute="count"
        label=""
        minimalHeader
        highlightedValue={total}
        customDateFormat={DATETIME_FORMAT}
        noDataMessage={'No confirmed users yet'}
      />
    </div>
  )
}

export const renderNewUsers = (
  props: ReportWidgetProps<{
    count: number
    timestamp: string
  }>
) => {
  const sum = (props.data || []).reduce((acc, datum) => datum.count + acc, 0)
  return (
    <div className="flex w-full flex-col">
      <BarChart
        data={props.data}
        attribute="count"
        label=""
        minimalHeader
        highlightedValue={sum}
        customDateFormat={DATETIME_FORMAT}
        noDataMessage={'No new user signups during this time period'}
      />
    </div>
  )
}

export const renderDailyActiveUsers = (
  props: ReportWidgetProps<{
    count: number
    timestamp: string
  }>
) => {
  const last = props.data?.[props.data.length - 1]?.count

  return (
    <div className="flex w-full flex-col">
      <BarChart
        data={props.data}
        attribute="count"
        label=""
        minimalHeader
        highlightedValue={last}
        customDateFormat={DATETIME_FORMAT}
        noDataMessage={'No authenticated users during this time period'}
      />
    </div>
  )
}

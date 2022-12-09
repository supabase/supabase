import { BarChart } from 'components/to-be-cleaned/Charts/ChartRenderer'
import { first } from 'lodash'
import { DATETIME_FORMAT } from '../Reports.constants'
import { ReportWidgetProps } from '../ReportWidget'

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
        label="Total users"
        highlightedValue={total}
        customDateFormat={DATETIME_FORMAT}
        noDataMessage={'No confirmed users yet'}
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
  return (
    <>
      <div className="flex w-full flex-col">
        <BarChart
          data={props.data}
          attribute="count"
          label=""
          minimalHeader
          customDateFormat={DATETIME_FORMAT}
          noDataMessage={'No authenticated users during this time period'}
        />
      </div>
    </>
  )
}

export const renderNewUsers = (
  props: ReportWidgetProps<{
    count: number
    timestamp: string
  }>
) => {
  return (
    <>
      <div className="flex w-full flex-col">
        <BarChart
          data={props.data}
          attribute="count"
          label=""
          minimalHeader
          customDateFormat={DATETIME_FORMAT}
          noDataMessage={'No new user signups during this time period'}
        />
      </div>
    </>
  )
}

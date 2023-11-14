import BarChart, { BarChartProps } from 'components/ui/Charts/BarChart'
import { Datum } from 'components/ui/Charts/Charts.types'
import { EventChartData, isUnixMicro, LogData, unixMicroToIsoTimestamp } from '.'

export interface LogEventChartProps {
  data: EventChartData[]
  onBarClick: (isoTimestamp: string) => void
}

const LogEventChart = ({ data, onBarClick }: LogEventChartProps) => (
  <BarChart
    minimalHeader
    size="tiny"
    yAxisKey="count"
    xAxisKey="timestamp"
    data={data}
    title="Logs / Time"
    onBarClick={(datum: Datum | EventChartData) => {
      if (!datum.timestamp) return
      onBarClick(datum.timestamp as string)
    }}
    customDateFormat="MMM D, HH:mm:s"
  />
)
export default LogEventChart

import BarChart, { BarChartProps } from 'components/ui/Charts/BarChart'
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
    data={data as unknown as BarChartProps['data']}
    title="Logs / Time"
    onBarClick={(v?: { activePayload?: { payload: any }[] }) => {
      if (!v || !v?.activePayload?.[0]?.payload) return
      const unixOrIsoTimestamp = v.activePayload[0].payload.timestamp
      const isoTimestamp = isUnixMicro(unixOrIsoTimestamp)
        ? unixMicroToIsoTimestamp(unixOrIsoTimestamp)
        : unixOrIsoTimestamp
      // 60s before
      onBarClick(isoTimestamp)
    }}
    customDateFormat="MMM D, HH:mm:s"
  />
)
export default LogEventChart

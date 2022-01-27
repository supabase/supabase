import { BarChart } from 'components/to-be-cleaned/Charts/ChartRenderer'
import dayjs from 'dayjs'
import { LogData } from '.'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
interface Props {
  data: LogData[]
  onBarClick: (timestamp: number) => void
}

type TimestampMap = { [timestamp: number]: number }
const LogEventChart: React.FC<Props> = ({ data, onBarClick }) => {
  if (!data) return null

  const countMap = data
    .map((d) => {
      //   truncate to per-minute
      return { ...d, timestamp: Math.round(d.timestamp / 1000 / 1000 / 60) * 60 }
    })
    .reduce((acc, d) => {
      if (acc[d.timestamp]) {
        acc[d.timestamp] = acc[d.timestamp] + 1
      } else {
        acc[d.timestamp] = 1
      }
      return acc
    }, {} as TimestampMap)

  let aggregated = []
  for (const [key, value] of Object.entries(countMap)) {
    const v: number = Number(key)
    aggregated.push({
      period_start: dayjs.unix(v).utc().format(),
      timestamp: key,
      timestampMicro: v * 1000 * 1000,
      count: value,
    })
  }
  aggregated = aggregated.sort((a, b) => a.timestampMicro - b.timestampMicro)

  return (
    <BarChart
      data={aggregated}
      attribute="count"
      label="Events"
      onBarClick={(v: any) => {
        const timestamp = v.activePayload[0].payload.timestamp
        // 60s before
        onBarClick((Number(timestamp) + 60) * 1000 * 1000)
      }}
      customDateFormat="YYYY-MM-DDTHH:mm:ss"
    />
  )
}

export default LogEventChart

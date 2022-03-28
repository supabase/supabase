import { BarChart } from 'components/to-be-cleaned/Charts/ChartRenderer'
import dayjs from 'dayjs'
import { LogData } from '.'
import utc from 'dayjs/plugin/utc'
import { useMemo } from 'react'
dayjs.extend(utc)
interface Props {
  data?: LogData[]
  onBarClick: (timestamp: number) => void
}

type TimestampMap = { [timestamp: number]: number }
const LogEventChart: React.FC<Props> = ({ data, onBarClick }) => {
  if (!data) return null
  const aggregated = useAggregated(data)

  return (
    <BarChart
      className="py-1 px-2"
      minimalHeader
      minmalChart
      data={aggregated}
      attribute="count"
      label="Events"
      onBarClick={(v: any) => {
        const timestamp = v.activePayload[0].payload.timestamp
        // 60s before
        onBarClick((Number(timestamp) + 60) * 1000 * 1000)
      }}
      customDateFormat="MMM D, HH:mm"
      displayDateInUtc
      noDataMessage={""}
    />
  )
}

const useAggregated = (data: LogData[]) => {
  const truncateToMinute = (micro: number) => Math.floor(micro / 1000 / 1000 / 60) * 60
  return useMemo(() => {
    const countMap = data
      .map((d) => {
        //   truncate to per-minute
        return { ...d, timestamp: truncateToMinute(d.timestamp) }
      })
      .reduce((acc, d) => {
        if (acc[d.timestamp]) {
          acc[d.timestamp] = acc[d.timestamp] + 1
        } else {
          acc[d.timestamp] = 1
        }
        return acc
      }, {} as TimestampMap)

    // Add in additional data points for empty minutes
    const oldestEvent = data[data.length - 1]
    if (!oldestEvent) return []
    const currentTimestamp = new Date().getTime()
    const oldestTimestampMicro = oldestEvent.timestamp
    const latestTimestamp = truncateToMinute(data[0]['timestamp'])
    const minutesDifference = Math.round(
      (currentTimestamp - oldestTimestampMicro / 1000) / 1000 / 60
    )
    for (const minToAdd of Array.from(Array(minutesDifference).keys())) {
      const tsToCheck = truncateToMinute(oldestTimestampMicro) + minToAdd * 60
      if (!(tsToCheck in countMap) && tsToCheck <= latestTimestamp) {
        countMap[tsToCheck] = 0
      }
    }

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
    return aggregated.sort((a, b) => a.timestampMicro - b.timestampMicro)
  }, [JSON.stringify(data)])
}
export default LogEventChart

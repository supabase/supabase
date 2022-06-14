import { BarChart } from 'components/to-be-cleaned/Charts/ChartRenderer'
import dayjs from 'dayjs'
import { LogData } from '.'
import { useMemo } from 'react'

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
      minimalHeader
      chartSize="tiny"
      data={aggregated}
      attribute="count"
      label="Events"
      onBarClick={(v?: {activePayload?: {payload: any}[]}) => {
        if (!v || !v?.activePayload?.[0]?.payload) return
        const timestamp = v.activePayload[0].payload.timestamp
        // 60s before
        onBarClick((Number(timestamp) + 60) * 1000 * 1000)
      }}
      customDateFormat="MMM D, HH:mm"
      displayDateInUtc
      noDataMessage={''}
    />
  )
}

const useAggregated = (data: LogData[]) => {
  const truncateToMinute = (micro: number) => Math.floor(micro / 1000 / 1000 / 60) * 60
  const truncateToHour = (micro: number) => Math.floor(micro / 1000 / 1000 / 60 / 60) * 60 * 60
  const getDiffMinute = (currentTimestamp: number, olderTimestamp: number) =>
    Math.round((currentTimestamp - olderTimestamp) / 1000 / 60)
  const getDiffHour = (currentTimestamp: number, olderTimestamp: number) =>
    Math.round((currentTimestamp - olderTimestamp) / 1000 / 60 / 60)
  const diffMultiplierMinute = (v: number) => v * 60
  const diffMultiplierHour = (v: number) => v * 60 * 60
  return useMemo(() => {
    const oldest = data[data.length - 1]
    if (!oldest) return
    const latest = data[0]
    const oldestDayjs = dayjs(oldest.timestamp / 1000)
    const latestDayjs = dayjs(latest.timestamp / 1000)
    let truncFunc = truncateToMinute
    let getDiff = getDiffMinute
    let diffMultiplier = diffMultiplierMinute
    if (Math.abs(oldestDayjs.diff(latestDayjs, 'day', true)) > 0.25) {
      truncFunc = truncateToHour
      getDiff = getDiffHour
      diffMultiplier = diffMultiplierHour
    }

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
    const latestTimestamp = truncFunc(data[0]['timestamp'])
    const diff = getDiff(currentTimestamp, oldestTimestampMicro / 1000)
    for (const toAdd of Array.from(Array(diff).keys())) {
      const tsToCheck = truncFunc(oldestTimestampMicro) + diffMultiplier(toAdd)
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

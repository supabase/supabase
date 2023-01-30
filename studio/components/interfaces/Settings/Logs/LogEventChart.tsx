import { BarChart } from 'components/to-be-cleaned/Charts/ChartRenderer'
import dayjs from 'dayjs'
import { EventChartData, isUnixMicro, LogData, unixMicroToIsoTimestamp } from '.'
import { useMemo } from 'react'

interface Props {
  data?: EventChartData[]
  onBarClick: (isoTimestamp: string) => void
}

const LogEventChart: React.FC<Props> = ({ data, onBarClick }) => {
  if (!data) return null
  // TODO: remove once endpoint returns iso timestamp directly
  const transformedData = useMemo(() => {
    return data.map((d) => {
      const iso = isUnixMicro(d.timestamp)
        ? unixMicroToIsoTimestamp(d.timestamp)
        : dayjs(d.timestamp).toISOString()

      return {
        ...d,
        timestamp: iso,
        // needed for bar chart
        // TODO: remove once bar chart is refactored
        period_start: iso,
      }
    })
  }, [JSON.stringify(data)])

  return (
    <BarChart
      minimalHeader
      chartSize="tiny"
      data={transformedData}
      attribute="count"
      label="Logs / Time"
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
      noDataMessage={''}
    />
  )
}

// const useAggregated = (data: LogData[]) => {
//   const truncateToMinute = (micro: number) => Math.floor(micro / 1000 / 1000 / 60) * 60
//   const truncateToHour = (micro: number) => Math.floor(micro / 1000 / 1000 / 60 / 60) * 60 * 60
//   const getDiffMinute = (currentTimestamp: number, olderTimestamp: number) =>
//     Math.round((currentTimestamp - olderTimestamp) / 1000 / 60)
//   const getDiffHour = (currentTimestamp: number, olderTimestamp: number) =>
//     Math.round((currentTimestamp - olderTimestamp) / 1000 / 60 / 60)
//   const diffMultiplierMinute = (v: number) => v * 60
//   const diffMultiplierHour = (v: number) => v * 60 * 60
//   return useMemo(() => {
//     const oldest = data[data.length - 1]
//     if (!oldest) return
//     const latest = data[0]
//     const oldestDayjs = dayjs(oldest.timestamp / 1000)
//     const latestDayjs = dayjs(latest.timestamp / 1000)
//     let truncFunc = truncateToMinute
//     let getDiff = getDiffMinute
//     let diffMultiplier = diffMultiplierMinute
//     if (Math.abs(oldestDayjs.diff(latestDayjs, 'day', true)) > 0.25) {
//       truncFunc = truncateToHour
//       getDiff = getDiffHour
//       diffMultiplier = diffMultiplierHour
//     }

//     const countMap = data
//       .map((d) => {
//         //   truncate to per-minute
//         return { ...d, timestamp: truncateToMinute(d.timestamp) }
//       })
//       .reduce((acc, d) => {
//         if (acc[d.timestamp]) {
//           acc[d.timestamp] = acc[d.timestamp] + 1
//         } else {
//           acc[d.timestamp] = 1
//         }
//         return acc
//       }, {} as TimestampMap)

//     // Add in additional data points for empty minutes
//     const oldestEvent = data[data.length - 1]
//     if (!oldestEvent) return []
//     const currentTimestamp = new Date().getTime()
//     const oldestTimestampMicro = oldestEvent.timestamp
//     const latestTimestamp = truncFunc(data[0]['timestamp'])
//     const diff = getDiff(currentTimestamp, oldestTimestampMicro / 1000)
//     for (const toAdd of Array.from(Array(diff).keys())) {
//       const tsToCheck = truncFunc(oldestTimestampMicro) + diffMultiplier(toAdd)
//       if (!(tsToCheck in countMap) && tsToCheck <= latestTimestamp) {
//         countMap[tsToCheck] = 0
//       }
//     }

//     let aggregated = []
//     for (const [key, value] of Object.entries(countMap)) {
//       const v: number = Number(key)
//       aggregated.push({
//         timestamp: key,
//         timestampMicro: v * 1000 * 1000,
//         count: value,
//       })
//     }
//     return aggregated.sort((a, b) => a.timestampMicro - b.timestampMicro)
//   }, [JSON.stringify(data)])
// }
export default LogEventChart

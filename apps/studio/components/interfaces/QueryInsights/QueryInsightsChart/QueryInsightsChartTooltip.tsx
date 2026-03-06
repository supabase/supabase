import dayjs from 'dayjs'
import type { TooltipProps } from 'recharts'
import { formatDuration } from '../QueryInsightsTable/QueryInsightsTable.utils'
import { isTimeMetric } from './QueryInsightsChart.utils'

export const QueryInsightsChartTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null

  const time = payload[0]?.payload?.time
  const localTimeZone = dayjs.tz.guess()

  return (
    <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg px-2.5 py-1.5 text-xs shadow-xl">
      <p className="text-foreground-light text-xs">{localTimeZone}</p>
      <p className="font-medium">{dayjs(time).format('MMM D, hh:mm:ssa')}</p>
      <div className="grid gap-0">
        {payload.map((entry, index) => (
          <div key={`${entry.name}-${index}`} className="flex items-center w-full">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="3" fill={entry.color} />
            </svg>
            <span className="text-foreground-lighter ml-1 flex-grow">{entry.name}</span>
            <span className="ml-3.5">
              {typeof entry.value === 'number'
                ? isTimeMetric(typeof entry.dataKey === 'string' ? entry.dataKey : '')
                  ? formatDuration(entry.value)
                  : entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

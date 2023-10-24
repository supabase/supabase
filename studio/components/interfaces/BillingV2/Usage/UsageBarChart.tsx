import { DataPoint } from 'data/analytics/constants'
import dayjs from 'dayjs'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// [Joshen] This BarChart is specifically for usage, hence not a reusable component, and not
// replacing the existing BarChart in ui/Charts

export interface UsageBarChartProps {
  data: DataPoint[]
  name: string // Used within the tooltip
  attribute: string
  unit: 'bytes' | 'absolute' | 'percentage'
  yLimit?: number
  yLeftMargin?: number
  yFormatter?: (value: number | string) => string
  tooltipFormatter?: (value: number | string) => string
}

const UsageBarChart = ({
  data,
  name,
  attribute,
  unit,
  yLimit,
  yLeftMargin = 10,
  yFormatter,
  tooltipFormatter,
}: UsageBarChartProps) => {
  const yMin = 0 // We can consider passing this as a prop if there's a use case in the future

  const yDomain = [yMin, yLimit ?? 0]

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 0, right: 0, left: yLeftMargin, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-scale-800" />
          <XAxis dataKey="periodStartFormatted" />
          <YAxis
            width={40}
            axisLine={false}
            tickLine={{ stroke: 'none' }}
            domain={yDomain}
            tickFormatter={yFormatter}
          />
          <Tooltip
            content={(props) => {
              const { active, payload } = props
              if (active && payload && payload.length) {
                const dataPeriod = dayjs(payload[0].payload.period_start)
                const value =
                  unit === 'percentage'
                    ? Number(payload[0].value).toFixed(2)
                    : Number(payload[0].value)

                return (
                  <div className="w-[170px] border bg-scale-300 rounded-md px-2 py-2">
                    <p className="text-xs text-foreground-light">
                      {attribute === 'disk_io_budget' ? `Remaining IO budget:` : `${name}:`}
                    </p>
                    {dataPeriod.startOf('day').isAfter(dayjs().startOf('day')) ? (
                      <p className="text-foreground-light text-lg">No data yet</p>
                    ) : (
                      <p className="text-xl">
                        {tooltipFormatter !== undefined ? tooltipFormatter(value) : value}
                      </p>
                    )}
                    <p className="text-xs text-foreground-light mt-1">
                      {dataPeriod.format('DD MMM YYYY')}
                    </p>
                  </div>
                )
              } else return null
            }}
          />
          <Bar dataKey={attribute}>
            {data.map((entry) => {
              return <Cell key={`${entry.period_start}`} className="fill-scale-1200" />
            })}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default UsageBarChart

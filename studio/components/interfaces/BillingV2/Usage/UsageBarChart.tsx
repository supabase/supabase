import { DataPoint } from 'data/analytics/constants'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Y_DOMAIN_CEILING_MULTIPLIER } from './Usage.constants'
import dayjs from 'dayjs'

// [Joshen] This BarChart is specifically for usage, hence not a reusable component, and not
// replacing the existing BarChart in ui/Charts

export interface UsageBarChartProps {
  data: DataPoint[]
  name: string // Used within the tooltip
  attribute: string
  unit: 'bytes' | 'absolute' | 'percentage'
  hasQuota?: boolean
  yLimit?: number
  yLeftMargin?: number
  yFormatter?: (value: number | string) => string
  quotaWarningType?: 'warning' | 'danger'
}

const UsageBarChart = ({
  data,
  name,
  attribute,
  unit,
  hasQuota = false,
  yLimit,
  yLeftMargin = 10,
  yFormatter,
  quotaWarningType = 'warning',
}: UsageBarChartProps) => {
  const yMin = 0 // We can consider passing this as a prop if there's a use case in the future
  const yMax = (yLimit ?? 0) * Y_DOMAIN_CEILING_MULTIPLIER
  const quotaWarningClass = quotaWarningType === 'warning' ? 'fill-amber-900' : 'fill-red-900'

  const yDomain = [yMin, yLimit ?? 0]
  const ticks =
    yLimit !== undefined && hasQuota
      ? [yMin, (yMax - yMin) * 0.25, (yMax - yMin) * 0.5, (yMax - yMin) * 0.75, yMax].map((x) =>
          Math.ceil(x)
        )
      : undefined

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
            ticks={ticks}
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
                    <p className="text-xs text-scale-1000">
                      {attribute === 'disk_io_budget' ? `Remaining IO budget:` : `${name}:`}
                    </p>
                    {dataPeriod.startOf('day').isAfter(dayjs().startOf('day')) ? (
                      <p className="text-scale-1000 text-lg">No data yet</p>
                    ) : (
                      <p className="text-xl">
                        {yFormatter !== undefined ? yFormatter(value) : value}
                      </p>
                    )}
                    <p className="text-xs text-scale-1100 mt-1">
                      {dataPeriod.format('DD MMM YYYY')}
                    </p>
                  </div>
                )
              } else return null
            }}
          />
          <Bar dataKey={attribute}>
            {data.map((entry) => {
              return (
                <Cell
                  key={`${entry.period_start}`}
                  className={
                    yLimit !== undefined && Number(entry[attribute]) >= yLimit && hasQuota
                      ? quotaWarningClass
                      : 'fill-scale-1200'
                  }
                />
              )
            })}
          </Bar>
          {hasQuota && yLimit && (
            <ReferenceLine
              y={yLimit}
              label={(props) => (
                <foreignObject
                  x={props.viewBox.x + 30}
                  y={props.viewBox.y - 10}
                  width={200}
                  height={24}
                >
                  <div className="text-[0.7rem] font-bold text-scale-1200 bg-scale-100 w-fit p-1.5 py-0.5 rounded-md">
                    INCLUDED USAGE
                  </div>
                </foreignObject>
              )}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default UsageBarChart

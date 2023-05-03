import { DataPoint } from 'data/analytics/constants'
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  YAxis,
  XAxis,
  Bar,
  ReferenceLine,
  Cell,
  Label,
} from 'recharts'
import { Y_DOMAIN_CEILING_MULTIPLIER } from './Usage.constants'

// [Joshen] This BarChart is specifically for usage, hence not a reusable component, and not
// replacing the existing BarChart in ui/Charts

export interface BarChartProps {
  data: DataPoint[]
  attribute: string
  unit?: string
  hasQuota?: boolean
  yLimit?: number
  yLeftMargin?: number
  yFormatter?: (value: number) => string
}

const BarChart = ({
  data,
  attribute,
  unit,
  hasQuota = false,
  yLimit,
  yLeftMargin = 10,
  yFormatter,
}: BarChartProps) => {
  const yMin = 0 // We can consider passing this as a prop if there's a use case in the future
  const yMax = (yLimit ?? 0) * Y_DOMAIN_CEILING_MULTIPLIER

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
          <XAxis dataKey="period_start" />
          <YAxis
            width={28}
            axisLine={false}
            tickLine={{ stroke: 'none' }}
            domain={yDomain}
            unit={unit}
            ticks={ticks}
            tickFormatter={yFormatter}
          />
          <Bar dataKey={attribute}>
            {data.map((entry) => {
              return (
                <Cell
                  className={
                    yLimit !== undefined && Number(entry[attribute]) >= yLimit
                      ? 'fill-amber-900'
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
                    PLAN QUOTA
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

export default BarChart

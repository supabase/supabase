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
} from 'recharts'

// [Joshen] I don't think I should be replacing ChartHandler just yet as the styling of the usage charts
// are slightly different from that on the other pages, just in case.

interface Reference {
  value: number
  label: string
  width: number
  height: number
  x: number
  y: number
}

export interface BarChartProps {
  data: DataPoint[]
  attribute: string
  reference?: Reference
  unit?: string
  yDomain?: number[]
  yFormatter?: (value: number) => string
}

const BarChart = ({ data, attribute, reference, unit, yDomain, yFormatter }: BarChartProps) => {
  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-scale-800" />
          <XAxis dataKey="period_start" />
          <YAxis
            width={28}
            axisLine={false}
            tickLine={{ stroke: 'none' }}
            domain={yDomain}
            unit={unit}
            tickFormatter={yFormatter}
          />
          <Bar dataKey={attribute}>
            {data.map((entry) => {
              return (
                <Cell
                  className={
                    reference !== undefined && Number(entry[attribute]) >= reference.value
                      ? 'fill-amber-900'
                      : 'fill-scale-1200'
                  }
                />
              )
            })}
          </Bar>
          {reference && (
            <ReferenceLine
              y={reference.value}
              label={
                <foreignObject
                  x={reference.x}
                  y={reference.y}
                  width={reference.width}
                  height={reference.height}
                >
                  <div className="text-[0.7rem] font-bold text-scale-1200 bg-scale-100 w-fit p-1.5 py-0.5 rounded-md">
                    {reference.label}
                  </div>
                </foreignObject>
              }
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BarChart

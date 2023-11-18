import clsx from 'clsx'
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
import { Attribute, COLOR_MAP } from './Usage.constants'
import { MultiAttributeTooltipContent, SingleAttributeTooltipContent } from './UsageChartTooltips'

// [Joshen] This BarChart is specifically for usage, hence not a reusable component, and not
// replacing the existing BarChart in ui/Charts

export interface UsageBarChartProps {
  data: DataPoint[]
  name: string // Used within the tooltip
  attributes: Attribute[]
  unit: 'bytes' | 'absolute' | 'percentage'
  yLimit?: number
  yLeftMargin?: number
  yFormatter?: (value: number | string) => string
  tooltipFormatter?: (value: number | string) => string
}

const UsageBarChart = ({
  data,
  name,
  attributes,
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
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-border-stronger"
          />
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
                const isAfterToday = dataPeriod.startOf('day').isAfter(dayjs().startOf('day'))
                return (
                  <div
                    className={clsx(
                      'border bg-surface-100 rounded-md px-2 py-2',
                      attributes.length > 1 && !isAfterToday ? 'w-[250px]' : 'w-[170px]'
                    )}
                  >
                    {attributes.length > 1 ? (
                      <MultiAttributeTooltipContent
                        attributes={attributes}
                        values={payload}
                        isAfterToday={isAfterToday}
                        tooltipFormatter={tooltipFormatter}
                      />
                    ) : (
                      <SingleAttributeTooltipContent
                        name={name}
                        unit={unit}
                        value={payload[0].value}
                        tooltipFormatter={tooltipFormatter}
                        isAfterToday={isAfterToday}
                      />
                    )}
                    <p className="text-xs text-foreground-light mt-1">
                      {dataPeriod.format('DD MMM YYYY')}
                    </p>
                  </div>
                )
              } else return null
            }}
          />
          {attributes?.map((attr) => (
            <Bar key={attr.key} dataKey={attr.key} stackId="a">
              {data.map((entry) => {
                return <Cell key={`${entry.period_start}`} className={COLOR_MAP[attr.color].bar} />
              })}
            </Bar>
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default UsageBarChart

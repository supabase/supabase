import { DataPoint } from 'data/analytics/constants'
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
import dayjs from 'dayjs'
import clsx from 'clsx'

// [Joshen] This BarChart is specifically for usage, hence not a reusable component, and not
// replacing the existing BarChart in ui/Charts

// [Joshen] There's shit ton of clean up to do here for org billing because we were copying over from project usage
// Please do so properly to prevent any confusion - priority on maintainability

const COLOR_MAP = {
  white: { bar: 'fill-scale-1200', marker: 'bg-scale-1200' },
  green: { bar: 'fill-green-1000', marker: 'bg-green-1000' },
  blue: { bar: 'fill-blue-1000', marker: 'bg-blue-1000' },
}

export interface UsageBarChartProps {
  data: DataPoint[]
  name: string // Used within the tooltip
  attributes: { key: string; name?: string; color: 'white' | 'blue' | 'green' }[] // [JOSHEN TODO] Extract as type with Usage.constants
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

              // [JOSHEN TODO] Refactor this, please do away with single attribute logics
              if (active && payload && payload.length) {
                const dataPeriod = dayjs(payload[0].payload.period_start)
                const value =
                  unit === 'percentage'
                    ? Number(payload[0].value).toFixed(2)
                    : Number(payload[0].value)

                return (
                  <div
                    className={clsx(
                      'border bg-scale-300 rounded-md px-2 py-2',
                      attributes.length > 1 ? 'w-[250px]' : 'w-[170px]'
                    )}
                  >
                    {attributes.length > 1 ? (
                      <>
                        {dataPeriod.startOf('day').isAfter(dayjs().startOf('day')) ? (
                          <p className="text-scale-1000 text-lg">No data yet</p>
                        ) : (
                          <div className="space-y-1">
                            {attributes.map((attr) => {
                              const attrMeta = payload.find((x) => x.dataKey === attr.key)
                              const attrValue = Number(attrMeta?.value ?? 0)
                              const sumValue = payload.reduce((a, b) => a + Number(b.value), 0)
                              const percentageContribution = ((attrValue / sumValue) * 100).toFixed(
                                1
                              )

                              return (
                                <div key={attr.name} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 w-[200px]">
                                    <div
                                      className={clsx(
                                        'w-3 h-3 rounded-full border',
                                        COLOR_MAP[attr.color].marker
                                      )}
                                    />
                                    <p className="text-sm prose">
                                      {attr.name} ({percentageContribution}%):{' '}
                                    </p>
                                  </div>
                                  <p className="text-sm tabular-nums">
                                    {tooltipFormatter !== undefined
                                      ? tooltipFormatter(attrValue)
                                      : attrValue}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-scale-1000">{name}</p>
                        {dataPeriod.startOf('day').isAfter(dayjs().startOf('day')) ? (
                          <p className="text-scale-1000 text-lg">No data yet</p>
                        ) : (
                          <p className="text-xl">
                            {tooltipFormatter !== undefined ? tooltipFormatter(value) : value}
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-scale-1100 mt-1">
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

import dayjs from 'dayjs'
import { useState } from 'react'
import { BarChart, Bar, XAxis, Tooltip, Legend, Cell } from 'recharts'
import ChartHeader from './ChartHeader'
import { CHART_COLORS, STACK_COLORS, DateTimeFormats } from './Charts.constants'
import { CommonChartProps, StackedChartProps } from './Charts.types'
import { timestampFormatter, useChartSize, useStacked } from './Charts.utils'
import { precisionFormatter } from './Charts.utils'
import NoDataPlaceholder from './NoDataPlaceholder'

interface Props extends CommonChartProps<any> {
  xAxisKey: string
  yAxisKey: string
  stackKey: string
  onBarClick?: () => void
  variant?: 'values' | 'percentages'
  xAxisFormatAsDate?: boolean
}
const StackedBarChart: React.FC<Props> = ({
  size,
  data,
  xAxisKey,
  stackKey,
  yAxisKey,
  customDateFormat = DateTimeFormats.FULL,
  title,
  format,
  minimalHeader = false,
  onBarClick,
  variant,
  xAxisFormatAsDate = true,
}) => {
  const { Container } = useChartSize(size)
  const { dataKeys, stackedData } = useStacked({ data, xAxisKey, stackKey, yAxisKey, variant })
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)
  if (data.length === 0) return <NoDataPlaceholder />
  return (
    <div>
      <ChartHeader
        title={title}
        format={format}
        customDateFormat={customDateFormat}
        minimalHeader={minimalHeader}
      />
      <Container>
        <BarChart
          data={stackedData}
          margin={{
            top: 20,
            right: 20,
            left: 20,
            bottom: 5,
          }}
          className="cursor-pointer overflow-visible"
          //   mouse hover focusing logic
          onMouseMove={(e: any) => {
            console.log(e)
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }
          }}
          onMouseLeave={() => setFocusDataIndex(null)}
        >
          <Legend
            wrapperStyle={{ top: -8, fontSize: '0.8rem' }}
            iconSize={8}
            iconType="circle"
            // margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
            verticalAlign="top"
          />

          <XAxis
            dataKey={xAxisKey}
            interval={data.length - 2}
            angle={0}
            tick={{ fontSize: '0px' }}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          {/* <YAxis dataKey={yAxisKey} /> */}
          {/* <Tooltip /> */}
          {dataKeys.map((datum, stackIndex) => (
            <Bar
              key={stackIndex}
              dataKey={datum}
              type="monotone"
              legendType="circle"
              fill={STACK_COLORS[stackIndex].base}
              stackId={1}
              animationDuration={300}
              maxBarSize={48}
              className={onBarClick ? 'cursor-pointer' : ''}
            >
              {stackedData?.map((_entry: unknown, index: any) => (
                <Cell
                  key={`cell-${index}`}
                  className={`transition-all duration-300`}
                  opacity={focusDataIndex === index ? 0.85 : 1}
                />
              ))}
            </Bar>
          ))}
          <Tooltip
            labelFormatter={xAxisFormatAsDate ? (label) => timestampFormatter(label) : undefined}
            formatter={(value: number) => {
              if (variant === 'percentages') {
                return precisionFormatter(value * 100, 1) + '%'
              }
              return value
            }}
            cursor={false}
            labelClassName="text-white"
            contentStyle={{ backgroundColor: '#444444', borderColor: '#444444', fontSize: '12px' }}
            wrapperClassName="bg-gray-600 rounded"
          />
        </BarChart>
      </Container>
      {/* {console.log(data)} */}
      {stackedData && stackedData[0] && (
        <div className="text-scale-900 -mt-5 flex items-center justify-between text-xs">
          <span>{dayjs(stackedData[0][xAxisKey]).format(customDateFormat)}</span>
          <span>{dayjs(stackedData[data?.length - 1]?.[xAxisKey]).format(customDateFormat)}</span>
        </div>
      )}
    </div>
  )
}

export default StackedBarChart

import { useState } from 'react'
import { Bar, BarChart, Cell, Legend, Tooltip, XAxis } from 'recharts'
import ChartHeader from './ChartHeader'
import {
  CHART_COLORS,
  DateTimeFormats,
  DEFAULT_STACK_COLORS,
  genStackColorScales,
  ValidStackColor,
} from './Charts.constants'
import { CommonChartProps } from './Charts.types'
import { precisionFormatter, timestampFormatter, useChartSize, useStacked } from './Charts.utils'
import NoDataPlaceholder from './NoDataPlaceholder'
interface Props extends CommonChartProps<any> {
  xAxisKey: string
  yAxisKey: string
  stackKey: string
  onBarClick?: () => void
  variant?: 'values' | 'percentages'
  xAxisFormatAsDate?: boolean
  displayDateInUtc?: boolean
  hideLegend?: boolean
  hideHeader?: boolean
  stackColors?: ValidStackColor[]
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
  displayDateInUtc,
  hideLegend = false,
  hideHeader = false,
  stackColors = DEFAULT_STACK_COLORS,
}) => {
  const { Container } = useChartSize(size)
  const { dataKeys, stackedData, percentagesStackedData } = useStacked({
    data,
    xAxisKey,
    stackKey,
    yAxisKey,
    variant,
  })
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)
  if (!data || data.length === 0) return <NoDataPlaceholder size={size} />
  const stackColorScales = genStackColorScales(stackColors)
  return (
    <div className="w-full">
      {!hideHeader && (
        <ChartHeader
          title={title}
          format={format}
          customDateFormat={customDateFormat}
          minimalHeader={minimalHeader}
        />
      )}
      <Container>
        <BarChart
          data={variant === 'percentages' ? percentagesStackedData : stackedData}
          margin={{
            top: 20,
            right: 20,
            left: 20,
            bottom: 5,
          }}
          className="cursor-pointer overflow-visible"
          //   mouse hover focusing logic
          onMouseMove={(e: any) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }
          }}
          onMouseLeave={() => setFocusDataIndex(null)}
        >
          {!hideLegend && (
            <Legend
              wrapperStyle={{ top: -6, fontSize: '0.8rem' }}
              iconSize={8}
              iconType="circle"
              verticalAlign="top"
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            interval={data.length - 2}
            angle={0}
            tick={false}
            axisLine={{ stroke: CHART_COLORS.AXIS }}
            tickLine={{ stroke: CHART_COLORS.AXIS }}
          />
          {dataKeys.map((datum, stackIndex) => (
            <Bar
              key={stackIndex}
              dataKey={datum}
              type="monotone"
              legendType="circle"
              fill={stackColorScales[stackIndex].base}
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
            labelFormatter={
              xAxisFormatAsDate
                ? (label) => timestampFormatter(label, customDateFormat, displayDateInUtc)
                : undefined
            }
            formatter={(value, name, props) => {
              const suffix = format || ''
              if (variant === 'percentages' && percentagesStackedData) {
                const index = percentagesStackedData.findIndex(
                  (pStack) => pStack === props.payload!
                )
                const val = stackedData[index][name]
                const percentage = precisionFormatter(Number(value) * 100, 1) + '%'
                return `${percentage} (${val}${suffix})`
              }
              return String(value) + suffix
            }}
            cursor={false}
            labelClassName="text-white"
            contentStyle={{ backgroundColor: '#444444', borderColor: '#444444', fontSize: '12px' }}
            wrapperClassName="bg-gray-600 rounded min-w-md"
          />
        </BarChart>
      </Container>
      {stackedData && stackedData[0] && (
        <div className="text-foreground-lighter -mt-5 flex items-center justify-between text-xs">
          <span>
            {timestampFormatter(
              stackedData[0][xAxisKey] as string,
              customDateFormat,
              displayDateInUtc
            )}
          </span>
          <span>
            {timestampFormatter(
              stackedData[stackedData?.length - 1][xAxisKey] as string,
              customDateFormat,
              displayDateInUtc
            )}
          </span>
        </div>
      )}
    </div>
  )
}

export default StackedBarChart

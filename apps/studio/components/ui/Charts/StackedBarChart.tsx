import dayjs from 'dayjs'
import { useState } from 'react'
import { Bar, BarChart, Cell, Legend, Tooltip, XAxis } from 'recharts'

import { ChartHeader } from './ChartHeader'
import {
  CHART_COLORS,
  DateTimeFormats,
  DEFAULT_STACK_COLORS,
  genStackColorScales,
  ValidStackColor,
} from './Charts.constants'
import type { CommonChartProps } from './Charts.types'
import {
  numberFormatter,
  precisionFormatter,
  timestampFormatter,
  useChartSize,
  useStacked,
} from './Charts.utils'
import NoDataPlaceholder from './NoDataPlaceholder'
import { useChartHoverState } from './useChartHoverState'

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
  syncId?: string
}
const StackedBarChart: React.FC<Props> = ({
  size,
  data,
  xAxisKey,
  stackKey,
  yAxisKey,
  customDateFormat = DateTimeFormats.FULL,
  title,
  highlightedValue,
  highlightedLabel,
  format,
  minimalHeader = false,
  valuePrecision,
  onBarClick,
  variant,
  xAxisFormatAsDate = true,
  displayDateInUtc,
  hideLegend = false,
  hideHeader = false,
  stackColors = DEFAULT_STACK_COLORS,
  syncId,
}) => {
  const { Container } = useChartSize(size)
  const { hoveredIndex, syncTooltip, setHover, clearHover } = useChartHoverState(
    syncId || 'default'
  )
  const { dataKeys, stackedData, percentagesStackedData } = useStacked({
    data,
    xAxisKey,
    stackKey,
    yAxisKey,
    variant,
  })
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  const day = (value: number | string) => (displayDateInUtc ? dayjs(value).utc() : dayjs(value))
  const resolvedHighlightedLabel =
    (focusDataIndex !== null &&
      data &&
      data[focusDataIndex] !== undefined &&
      day(data[focusDataIndex][xAxisKey]).format(customDateFormat)) ||
    highlightedLabel

  const resolvedHighlightedValue =
    focusDataIndex !== null ? data[focusDataIndex]?.[yAxisKey] : highlightedValue

  if (!data || data.length === 0) {
    return (
      <NoDataPlaceholder
        description="It may take up to 24 hours for data to refresh"
        size={size}
        attribute={title}
        format={format}
      />
    )
  }

  const stackColorScales = genStackColorScales(stackColors)
  return (
    <div className="w-full">
      {!hideHeader && (
        <ChartHeader
          title={title}
          format={format}
          customDateFormat={customDateFormat}
          minimalHeader={minimalHeader}
          highlightedValue={
            typeof resolvedHighlightedValue === 'number'
              ? numberFormatter(resolvedHighlightedValue, valuePrecision)
              : resolvedHighlightedValue
          }
          highlightedLabel={resolvedHighlightedLabel}
          syncId={syncId}
          data={data}
          xAxisKey={xAxisKey}
          yAxisKey={yAxisKey}
          xAxisIsDate={xAxisFormatAsDate}
          displayDateInUtc={displayDateInUtc}
          valuePrecision={valuePrecision}
          attributes={[]}
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

            setHover(e.activeTooltipIndex)
          }}
          onMouseLeave={() => {
            setFocusDataIndex(null)

            clearHover()
          }}
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
            contentStyle={{
              backgroundColor: '#444444',
              borderColor: '#444444',
              fontSize: '12px',
            }}
            wrapperClassName="bg-gray-600 rounded min-w-md"
            active={!!syncId && syncTooltip && hoveredIndex !== null}
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

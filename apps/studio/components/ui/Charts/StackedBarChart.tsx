import { useState } from 'react'
import { Bar, BarChart, Cell, Legend, XAxis } from 'recharts'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useChartSync } from './useChartSync'
import ChartHeader from './ChartHeader'
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'
dayjs.extend(utc)

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
  margin?: { top: number; right: number; left: number; bottom: number }
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
  margin,
}) => {
  const { minHeight } = useChartSize(size)
  const {
    updateState: updateSyncState,
    clearState: clearSyncState,
    state: syncState,
  } = useChartSync(syncId)
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
      <ChartContainer config={{}} className="w-full aspect-auto" style={{ height: minHeight }}>
        <BarChart
          data={variant === 'percentages' ? percentagesStackedData : stackedData}
          margin={
            margin ?? {
              top: 20,
              right: 20,
              left: 20,
              bottom: 5,
            }
          }
          className="cursor-pointer overflow-visible"
          //   mouse hover focusing logic
          onMouseMove={(e: any) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }

            if (syncId) {
              updateSyncState({
                activeIndex: e.activeTooltipIndex,
                activePayload: e.activePayload,
                activeLabel: e.activeLabel,
                isHovering: true,
              })
            }
          }}
          onMouseLeave={() => {
            setFocusDataIndex(null)

            if (syncId) {
              clearSyncState()
            }
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
          <ChartTooltip
            cursor={false}
            active={!!syncId && syncState.isHovering}
            content={
              <ChartTooltipContent
                labelFormatter={
                  xAxisFormatAsDate
                    ? (label) =>
                        timestampFormatter(label as string, customDateFormat, displayDateInUtc)
                    : undefined
                }
                formatter={(value, name, item) => {
                  const labelName = String(name)
                  const suffix = format || ''
                  if (variant === 'percentages' && percentagesStackedData) {
                    const index = percentagesStackedData.findIndex(
                      (pStack) => pStack === (item as any).payload
                    )
                    const val = stackedData[index][name as string]
                    const percentage = precisionFormatter(Number(value as number) * 100, 1) + '%'
                    return (
                      <div className="flex w-full items-center justify-between">
                        <span className="text-foreground-light">{labelName}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">{`${percentage} (${val}${suffix})`}</span>
                      </div>
                    )
                  }
                  return (
                    <div className="flex w-full items-center justify-between">
                      <span className="text-foreground-light">{labelName}</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {String(value) + suffix}
                      </span>
                    </div>
                  )
                }}
              />
            }
          />
        </BarChart>
      </ChartContainer>
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

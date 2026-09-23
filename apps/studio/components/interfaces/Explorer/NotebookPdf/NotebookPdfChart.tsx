import { Line, Path, Rect, Svg, Text, View } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

import { pdfColors, pdfStyles } from './theme'
import {
  formatLogTick,
  formatYAxisTick,
  getCumulativeResults,
} from '@/components/ui/QueryBlock/QueryBlock.utils'

const CHART_WIDTH = 480
const CHART_HEIGHT = 200
const MAX_X_LABELS = 12
const SERIES_COLORS = [pdfColors.brand, '#3b82f6', '#f59e0b']

/** Mirrors `ChartConfig` (data/content/notebooks/notebook-schema.ts) but with a readonly
 *  `y_series`, so this also accepts the deep-readonly `Snapshot<ChartConfig>` the notebook
 *  store hands components — no need to import valtio's `Snapshot` here for that alone. */
interface NotebookPdfChartConfig {
  type: 'bar' | 'line'
  x_column: string
  y_series: readonly string[]
  cumulative: boolean
  scale: 'linear' | 'log'
  show_labels: boolean
}

interface NotebookPdfChartProps {
  chart: NotebookPdfChartConfig | undefined
  rows: readonly Record<string, unknown>[]
}

/** Builds power-of-ten tick values within [min, max], falling back to the bounds themselves
 *  when the range doesn't span a full decade — matches the shape of `formatLogTick`'s inputs
 *  closely enough for a static report axis, without replicating d3's log-scale tick logic. */
function buildLogTicks(min: number, max: number): number[] {
  const ticks: number[] = []
  let tick = 10 ** Math.floor(Math.log10(min))
  while (tick <= max) {
    if (tick >= min) ticks.push(tick)
    tick *= 10
  }
  return ticks.length > 0 ? ticks : [min, max]
}

/**
 * Renders a bar or line chart natively with react-pdf's own Svg primitives, from the cell's
 * raw result rows and chart config — rather than rasterizing the live Recharts-rendered DOM
 * node. This avoids two problems with rasterization: the captured image always reflects
 * whatever theme (dark/light) the dashboard happened to be in, and the chart's DOM node has
 * to be currently mounted/visible to capture at all. A native render always uses the report's
 * own light palette and works regardless of the cell's on-screen state.
 */
export function NotebookPdfChart({ chart, rows }: NotebookPdfChartProps): ReactElement {
  const {
    type = 'bar',
    x_column,
    y_series = [],
    cumulative = false,
    scale = 'linear',
    show_labels = false,
  } = chart ?? {}

  if (!x_column || y_series.length === 0) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <Text style={pdfStyles.resultsPlaceholder}>Chart is not configured.</Text>
      </View>
    )
  }

  const baseRows = rows.map((row) => {
    const next: Record<string, unknown> = { [x_column]: row[x_column] }
    y_series.forEach((column) => {
      next[column] = Number(row[column]) || 0
    })
    return next
  })

  const plotRows: Record<string, unknown>[] = cumulative
    ? getCumulativeResults({ rows: baseRows }, { yKey: [...y_series] })
    : baseRows

  // Logarithmic scale only makes sense for a single series, mirroring DisplaySettingsButton's
  // own rule (QueryResultChart resets `scale` to linear once a second Y column is added).
  const isLogScale = y_series.length === 1 && scale === 'log'

  const allValues = plotRows.flatMap((row) => y_series.map((column) => Number(row[column]) || 0))
  const dataMax = Math.max(0, ...allValues)
  const dataMin = Math.min(0, ...allValues)
  const positiveValues = allValues.filter((value) => value > 0)

  const domainMin = isLogScale
    ? Math.max(1, Math.min(...(positiveValues.length > 0 ? positiveValues : [1])))
    : dataMin
  const domainMax = isLogScale
    ? Math.max(domainMin * 10, dataMax)
    : Math.max(dataMax, domainMin + 1)

  const formatTick = isLogScale ? formatLogTick : formatYAxisTick
  const yAxisWidth = show_labels
    ? Math.max(formatTick(domainMax).length, formatTick(domainMin).length) * 6 + 14
    : 0

  const margin = { top: 8, right: 8, bottom: show_labels ? 24 : 8, left: yAxisWidth }
  const plotWidth = CHART_WIDTH - margin.left - margin.right
  const plotHeight = CHART_HEIGHT - margin.top - margin.bottom

  const mapValueToY = (value: number): number => {
    if (isLogScale) {
      const clamped = Math.max(value, domainMin)
      const logMin = Math.log10(domainMin)
      const logMax = Math.log10(domainMax)
      const ratio = logMax === logMin ? 0 : (Math.log10(clamped) - logMin) / (logMax - logMin)
      return margin.top + plotHeight * (1 - ratio)
    }
    const ratio = domainMax === domainMin ? 0 : (value - domainMin) / (domainMax - domainMin)
    return margin.top + plotHeight * (1 - ratio)
  }

  const categoryCount = plotRows.length
  const slotWidth = categoryCount > 0 ? plotWidth / categoryCount : plotWidth
  const categoryCenterX = (index: number) => margin.left + index * slotWidth + slotWidth / 2

  const yTicks = isLogScale
    ? buildLogTicks(domainMin, domainMax)
    : Array.from({ length: 5 }, (_, index) => domainMin + ((domainMax - domainMin) * index) / 4)

  const xLabelStep = Math.max(1, Math.ceil(categoryCount / MAX_X_LABELS))
  const zeroY = mapValueToY(0)

  return (
    <View>
      {y_series.length > 1 && (
        <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 6 }}>
          {y_series.map((column, index) => (
            <View key={column} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length],
                }}
              />
              <Text style={{ fontSize: 7, color: pdfColors.textTertiary }}>{column}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ position: 'relative', width: CHART_WIDTH, height: CHART_HEIGHT }}>
        <Svg
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          {show_labels &&
            yTicks.map((tick, index) => (
              <Line
                key={index}
                x1={margin.left}
                x2={CHART_WIDTH - margin.right}
                y1={mapValueToY(tick)}
                y2={mapValueToY(tick)}
                stroke={pdfColors.border}
                strokeWidth={0.5}
              />
            ))}

          <Line
            x1={margin.left}
            x2={CHART_WIDTH - margin.right}
            y1={margin.top + plotHeight}
            y2={margin.top + plotHeight}
            stroke={pdfColors.border}
            strokeWidth={1}
          />

          {type === 'bar' &&
            plotRows.map((row, rowIndex) => {
              const groupWidth = slotWidth * 0.7
              const barWidth = groupWidth / y_series.length
              const groupStart = margin.left + rowIndex * slotWidth + (slotWidth - groupWidth) / 2

              return y_series.map((column, seriesIndex) => {
                const value = Number(row[column]) || 0
                const y = mapValueToY(value)
                const barTop = Math.min(y, zeroY)
                const barHeight = Math.max(1, Math.abs(y - zeroY))
                return (
                  <Rect
                    key={`${rowIndex}-${column}`}
                    x={groupStart + seriesIndex * barWidth}
                    y={barTop}
                    width={Math.max(1, barWidth - 1)}
                    height={barHeight}
                    fill={SERIES_COLORS[seriesIndex % SERIES_COLORS.length]}
                  />
                )
              })
            })}

          {type === 'line' &&
            y_series.map((column, seriesIndex) => {
              const points = plotRows.map((row, rowIndex) => {
                const value = Number(row[column]) || 0
                return `${rowIndex === 0 ? 'M' : 'L'} ${categoryCenterX(rowIndex)},${mapValueToY(value)}`
              })
              return (
                <Path
                  key={column}
                  d={points.join(' ')}
                  stroke={SERIES_COLORS[seriesIndex % SERIES_COLORS.length]}
                  strokeWidth={1.5}
                  fill="none"
                />
              )
            })}
        </Svg>

        {show_labels &&
          yTicks.map((tick, index) => (
            <Text
              key={index}
              style={{
                position: 'absolute',
                left: 0,
                top: mapValueToY(tick) - 4,
                width: margin.left - 4,
                fontSize: 6,
                color: pdfColors.textTertiary,
                textAlign: 'right',
              }}
            >
              {formatTick(tick)}
            </Text>
          ))}

        {show_labels &&
          plotRows.map((row, rowIndex) =>
            rowIndex % xLabelStep === 0 ? (
              <Text
                key={rowIndex}
                style={{
                  position: 'absolute',
                  left: categoryCenterX(rowIndex) - slotWidth / 2,
                  top: CHART_HEIGHT - margin.bottom + 4,
                  width: slotWidth,
                  fontSize: 6,
                  color: pdfColors.textTertiary,
                  textAlign: 'center',
                }}
              >
                {String(row[x_column])}
              </Text>
            ) : null
          )}
      </View>
    </View>
  )
}

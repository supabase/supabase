import { format } from 'date-fns'
import { SearchIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceArea, XAxis } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'

import { useDataTable } from './providers/DataTableProvider'
import {
  ChartHighlightAction,
  ChartHighlightActions,
} from '@/components/ui/Charts/ChartHighlightActions'
import { useChartHighlight } from '@/components/ui/Charts/useChartHighlight'

export type BaseChartSchema = { timestamp: number; [key: string]: number }
export const description = 'A stacked bar chart'

interface TimelineChartProps<TChart extends BaseChartSchema> {
  className?: string
  /**
   * The table column id to filter by - needs to be a type of `timerange` (e.g. "date").
   * TBD: if using keyof TData to be closer to the data table props
   */
  columnId: string
  /**
   * Optional override for the column id used when applying the time range filter.
   * Defaults to `columnId` if not provided.
   */
  filterColumnId?: string
  /**
   * Same data as of the InfiniteQueryMeta.
   */
  data: TChart[]
  chartConfig: ChartConfig
}

export function TimelineChart<TChart extends BaseChartSchema>({
  data,
  className,
  columnId,
  filterColumnId,
  chartConfig,
}: TimelineChartProps<TChart>) {
  const resolvedFilterColumnId = filterColumnId ?? columnId
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme?.includes('dark')

  const { table } = useDataTable()
  const chartHighlight = useChartHighlight()

  const showHighlight =
    chartHighlight?.left && chartHighlight?.right && chartHighlight?.left !== chartHighlight?.right

  // REMINDER: date has to be a string for tooltip label to work - don't ask me why
  const chart = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        [columnId]: new Date(item.timestamp).toString(),
      })),
    [data]
  )

  const timerange = useMemo(() => {
    if (data.length === 0) return { interval: 0, period: undefined }
    const first = data[0].timestamp
    const last = data[data.length - 1].timestamp
    const interval = Math.abs(first - last) // in ms
    return { interval, period: calculatePeriod(interval) }
  }, [data])

  const highlightActions: ChartHighlightAction[] = useMemo(
    () => [
      {
        id: 'zoom-in',
        label: 'Filter logs to selected range',
        icon: <SearchIcon className="text-foreground-lighter" size={12} />,
        onSelect: ({ start, end, clear }) => {
          const [left, right] = [start, end].sort(
            (a, b) => new Date(a).getTime() - new Date(b).getTime()
          )
          table.getColumn(resolvedFilterColumnId)?.setFilterValue([new Date(left), new Date(right)])
          clear()
        },
      },
    ],
    [table, resolvedFilterColumnId]
  )

  return (
    <div className="relative w-full">
      <ChartContainer
        config={chartConfig}
        className={cn(
          'aspect-auto h-[60px] w-full px-2',
          '[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/50', // otherwise same color as 200
          'select-none', // disable text selection
          className
        )}
      >
        <BarChart
          data={chart}
          margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onMouseDown={({ activeLabel, activeTooltipIndex }) => {
            if (activeTooltipIndex === undefined || activeTooltipIndex === null) return
            chartHighlight.handleMouseDown({ activeLabel, coordinates: activeLabel })
          }}
          onMouseMove={({ activeLabel, activeTooltipIndex }) => {
            if (activeTooltipIndex === undefined || activeTooltipIndex === null) return
            chartHighlight.handleMouseMove({ activeLabel, coordinates: activeLabel })
          }}
          onMouseUp={chartHighlight.handleMouseUp}
          style={{ cursor: 'crosshair' }}
        >
          <CartesianGrid vertical={false} horizontal={false} />
          <XAxis
            dataKey={columnId}
            tickLine={false}
            minTickGap={32}
            axisLine={false}
            tickFormatter={(value) => {
              const date = new Date(value)
              if (isNaN(date.getTime())) return 'N/A'
              if (timerange.period === '10m') {
                return format(date, 'HH:mm:ss')
              } else if (timerange.period === '1d') {
                return format(date, 'HH:mm')
              } else if (timerange.period === '1w') {
                return format(date, 'LLL dd HH:mm')
              }
              return format(date, 'LLL dd, y')
            }}
          />
          {!chartHighlight.popoverPosition && (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value)
                    if (isNaN(date.getTime())) return 'N/A'
                    if (timerange.period === '10m') {
                      return format(date, 'LLL dd, HH:mm:ss')
                    }
                    return format(date, 'LLL dd, y HH:mm')
                  }}
                />
              }
            />
          )}
          {/* TODO: we could use the `{timestamp, ...rest} = data[0]` to dynamically create the bars but that would mean the order can be very much random */}
          <Bar dataKey="error" stackId="a" fill="var(--color-error)" />
          <Bar dataKey="warning" stackId="a" fill="var(--color-warning)" />
          <Bar dataKey="success" stackId="a" fill="var(--color-success)" />
          {showHighlight && (
            <ReferenceArea
              x1={chartHighlight.left}
              x2={chartHighlight.right}
              strokeOpacity={0.5}
              stroke={isDarkMode ? '#FFFFFF' : '#0C3925'}
              fill={isDarkMode ? '#FFFFFF' : '#0C3925'}
              fillOpacity={0.2}
            />
          )}
        </BarChart>
      </ChartContainer>
      <ChartHighlightActions chartHighlight={chartHighlight} actions={highlightActions} />
    </div>
  )
}

// TODO: check what's a good abbreviation for month vs. minutes
function calculatePeriod(interval: number): '10m' | '1d' | '1w' | '1mo' {
  if (interval <= 1000 * 60 * 10) {
    // less than 10 minutes
    return '10m'
  } else if (interval <= 1000 * 60 * 60 * 24) {
    // less than 1 day
    return '1d'
  } else if (interval <= 1000 * 60 * 60 * 24 * 7) {
    // less than 1 week
    return '1w'
  }
  return '1mo' // defaults to 1 month
}

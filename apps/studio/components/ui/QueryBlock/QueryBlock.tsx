import { ReportBlockContainer } from 'components/interfaces/Reports/ReportBlock/ReportBlockContainer'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import dayjs from 'dayjs'
import { Code, Play } from 'lucide-react'
import { DragEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, ChartContainer, ChartTooltipContent, cn, CodeBlock } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ButtonTooltip } from '../ButtonTooltip'
import { CHART_COLORS } from '../Charts/Charts.constants'
import { SqlWarningAdmonition } from '../SqlWarningAdmonition'
import { BlockViewConfiguration } from './BlockViewConfiguration'
import { EditQueryButton } from './EditQueryButton'
import { checkHasNonPositiveValues, formatLogTick, getCumulativeResults } from './QueryBlock.utils'

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  type: 'bar',
  cumulative: false,
  xKey: '',
  yKey: '',
  showLabels: false,
  showGrid: false,
  logScale: false,
  view: 'table',
}

export interface QueryBlockProps {
  id?: string
  label: string
  sql?: string
  isWriteQuery?: boolean
  chartConfig?: ChartConfig
  actions?: ReactNode
  results?: any[]
  errorText?: string
  isExecuting?: boolean
  initialHideSql?: boolean
  draggable?: boolean
  disabled?: boolean
  blockWriteQueries?: boolean
  onExecute?: (queryType: 'select' | 'mutation') => void
  onRemoveChart?: () => void
  onUpdateChartConfig?: ({ chartConfig }: { chartConfig: Partial<ChartConfig> }) => void
  onDragStart?: (e: DragEvent<Element>) => void
}

// [Joshen ReportsV2] JFYI we may adjust this in subsequent PRs when we implement this into Reports V2
// First iteration here is just to make this work with the AI Assistant first
export const QueryBlock = ({
  id,
  label,
  sql,
  chartConfig = DEFAULT_CHART_CONFIG,
  actions,
  results,
  errorText,
  isWriteQuery = false,
  isExecuting = false,
  initialHideSql = false,
  draggable = false,
  disabled = false,
  blockWriteQueries = false,
  onExecute,
  onRemoveChart,
  onUpdateChartConfig,
  onDragStart,
}: QueryBlockProps) => {
  const [chartSettings, setChartSettings] = useState<ChartConfig>(chartConfig)
  const { xKey, yKey, view = 'table', logScale = false } = chartSettings

  const [showSql, setShowSql] = useState(!results && !initialHideSql)
  const [focusDataIndex, setFocusDataIndex] = useState<number>()
  const [showWarning, setShowWarning] = useState<'hasWriteOperation' | 'hasUnknownFunctions'>()

  const prevIsWriteQuery = useRef(isWriteQuery)

  useEffect(() => {
    if (!prevIsWriteQuery.current && isWriteQuery) {
      setShowWarning('hasWriteOperation')
    }
    if (!isWriteQuery && showWarning === 'hasWriteOperation') {
      setShowWarning(undefined)
    }
    prevIsWriteQuery.current = isWriteQuery
  }, [isWriteQuery, showWarning])

  useEffect(() => {
    setChartSettings(chartConfig)
  }, [chartConfig])

  const formattedQueryResult = useMemo(() => {
    return results?.map((row) => {
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
          if (key === yKey) return [key, Number(value)]
          return [key, value]
        })
      )
    })
  }, [results, yKey])

  const chartData = chartSettings.cumulative
    ? getCumulativeResults({ rows: formattedQueryResult ?? [] }, chartSettings)
    : formattedQueryResult

  const hasNonPositiveValues = useMemo(() => {
    if (!logScale || !yKey || !chartData?.length) return false
    return checkHasNonPositiveValues(chartData, yKey)
  }, [logScale, yKey, chartData])

  const effectiveLogScale = logScale && !hasNonPositiveValues

  const getDateFormat = (key: any) => {
    const value = chartData?.[0]?.[key] || ''
    if (typeof value === 'number') return 'number'
    if (dayjs(value).isValid()) return 'date'
    return 'string'
  }
  const xKeyDateFormat = getDateFormat(xKey)

  const hasResults = Array.isArray(results) && results.length > 0

  const runSelect = () => {
    if (!sql || disabled || isExecuting) return
    if (isWriteQuery) {
      setShowWarning('hasWriteOperation')
      return
    }
    onExecute?.('select')
  }

  const runMutation = () => {
    if (!sql || disabled || isExecuting) return
    setShowWarning(undefined)
    onExecute?.('mutation')
  }

  return (
    <ReportBlockContainer
      draggable={draggable}
      showDragHandle={draggable}
      onDragStart={(e: DragEvent<Element>) => onDragStart?.(e)}
      loading={isExecuting}
      label={label}
      badge={isWriteQuery && <Badge variant="warning">Write</Badge>}
      actions={
        disabled ? null : (
          <>
            <ButtonTooltip
              type="text"
              size="tiny"
              className="w-7 h-7"
              icon={<Code size={14} strokeWidth={1.5} />}
              onClick={() => setShowSql(!showSql)}
              tooltip={{
                content: { side: 'bottom', text: showSql ? 'Hide query' : 'Show query' },
              }}
            />
            {hasResults && (
              <BlockViewConfiguration
                view={view}
                isChart={view === 'chart'}
                lockColumns={false}
                chartConfig={chartSettings}
                columns={Object.keys(results?.[0] ?? {})}
                changeView={(nextView) => {
                  if (onUpdateChartConfig) onUpdateChartConfig({ chartConfig: { view: nextView } })
                  setChartSettings({ ...chartSettings, view: nextView })
                }}
                updateChartConfig={(config) => {
                  if (onUpdateChartConfig) onUpdateChartConfig({ chartConfig: config })
                  setChartSettings(config)
                }}
              />
            )}

            <EditQueryButton id={id} title={label} sql={sql} />
            <ButtonTooltip
              type="text"
              size="tiny"
              className="w-7 h-7"
              icon={<Play size={14} strokeWidth={1.5} />}
              loading={isExecuting}
              disabled={isExecuting || disabled || !sql}
              onClick={runSelect}
              tooltip={{
                content: {
                  side: 'bottom',
                  className: 'max-w-56 text-center',
                  text: isExecuting
                    ? 'Query is running. Check the SQL Editor to manage running queries.'
                    : 'Run query',
                },
              }}
            />

            {actions}
          </>
        )
      }
    >
      {!!showWarning && !blockWriteQueries && (
        <SqlWarningAdmonition
          warningType={showWarning}
          className="border-b"
          onCancel={() => setShowWarning(undefined)}
          onConfirm={runMutation}
          disabled={!sql}
          {...(showWarning !== 'hasWriteOperation'
            ? {
                message: 'Run this query now and send the results to the Assistant? ',
                subMessage:
                  'We will execute the query and provide the result rows back to the Assistant to continue the conversation.',
                cancelLabel: 'Skip',
                confirmLabel: 'Run & send',
              }
            : {})}
        />
      )}

      {showSql && (
        <div
          className={cn('shrink-0 grow-1 w-full h-full overflow-y-auto max-h-[min(300px, 100%)]', {
            'border-b': results !== undefined,
          })}
        >
          <CodeBlock
            hideLineNumbers
            wrapLines={false}
            value={sql}
            language="sql"
            className={cn(
              'max-w-none block !bg-transparent !py-3 !px-3.5 prose dark:prose-dark border-0 text-foreground !rounded-none w-full',
              '[&>code]:m-0 [&>code>span]:text-foreground'
            )}
          />
        </div>
      )}

      {isExecuting && !results && (
        <div className="p-3 w-full border-t">
          <ShimmeringLoader />
        </div>
      )}

      {view === 'chart' && results !== undefined ? (
        <>
          {(results ?? []).length === 0 ? (
            <div className="flex w-full h-full items-center justify-center py-3">
              <p className="text-foreground-light text-xs">No results returned from query</p>
            </div>
          ) : !xKey || !yKey ? (
            <div className="flex w-full h-full items-center justify-center">
              <p className="text-foreground-light text-xs">Select columns for the X and Y axes</p>
            </div>
          ) : (
            <div className="flex-1 w-full">
              {hasNonPositiveValues && (
                <p className="px-3 pt-1 text-xs text-foreground-light">
                  Log scale is unavailable because the data contains zero or negative values.
                </p>
              )}
              <ChartContainer
                className="aspect-auto px-3 py-2"
                style={{ height: '230px', minHeight: '230px' }}
              >
                <BarChart
                  accessibilityLayer
                  margin={{ left: -20, right: 0, top: 10 }}
                  data={chartData}
                  onMouseMove={(e: any) => {
                    if (e.activeTooltipIndex !== focusDataIndex) {
                      setFocusDataIndex(e.activeTooltipIndex)
                    }
                  }}
                  onMouseLeave={() => setFocusDataIndex(undefined)}
                >
                  <CartesianGrid vertical={false} stroke={CHART_COLORS.AXIS} />
                  <XAxis
                    dataKey={xKey}
                    tickLine={{ stroke: CHART_COLORS.AXIS }}
                    axisLine={{ stroke: CHART_COLORS.AXIS }}
                    interval="preserveStartEnd"
                    tickMargin={4}
                    minTickGap={32}
                    tickFormatter={(value) =>
                      xKeyDateFormat === 'date' ? dayjs(value).format('MMM D YYYY HH:mm') : value
                    }
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    scale={effectiveLogScale ? 'log' : 'auto'}
                    domain={effectiveLogScale ? [1, 'auto'] : undefined}
                    allowDataOverflow={effectiveLogScale}
                    width={effectiveLogScale ? 52 : undefined}
                    tickFormatter={effectiveLogScale ? formatLogTick : undefined}
                  />
                  <Tooltip content={<ChartTooltipContent className="w-[150px]" />} />
                  <Bar radius={1} dataKey={yKey}>
                    {chartData?.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        className="transition-all duration-100"
                        fill="hsl(var(--chart-1))"
                        opacity={focusDataIndex === undefined || focusDataIndex === index ? 1 : 0.4}
                        enableBackground={12}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </>
      ) : (
        <>
          {isWriteQuery && blockWriteQueries ? (
            <div className="flex flex-col h-full justify-center items-center text-center">
              <p className="text-xs text-foreground-light">
                SQL query is not read-only and cannot be rendered
              </p>
              <p className="text-xs text-foreground-lighter text-center">
                Queries that involve any mutation will not be run in reports
              </p>
              {!!onRemoveChart && (
                <Button type="default" className="mt-2" onClick={() => onRemoveChart()}>
                  Remove chart
                </Button>
              )}
            </div>
          ) : !isExecuting && !!errorText ? (
            <div className={cn('flex-1 w-full overflow-auto relative border-t px-3.5 py-2')}>
              <span className="font-mono text-xs">ERROR: {errorText}</span>
            </div>
          ) : (
            results && (
              <div className={cn('flex-1 w-full overflow-auto relative max-h-64')}>
                <Results rows={results} />
              </div>
            )
          )}
        </>
      )}
    </ReportBlockContainer>
  )
}

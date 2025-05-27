import { Code, Play } from 'lucide-react'
import { DragEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ReportBlockContainer } from 'components/interfaces/Reports/ReportBlock/ReportBlockContainer'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { usePrimaryDatabase } from 'data/read-replicas/replicas-query'
import { QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import dayjs from 'dayjs'
import { Parameter, parseParameters } from 'lib/sql-parameters'
import { Dashboards } from 'types'
import { ChartContainer, ChartTooltipContent, cn, CodeBlock, SQL_ICON } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { ButtonTooltip } from '../ButtonTooltip'
import { CHART_COLORS } from '../Charts/Charts.constants'
import SqlWarningAdmonition from '../SqlWarningAdmonition'
import { BlockViewConfiguration } from './BlockViewConfiguration'
import { EditQueryButton } from './EditQueryButton'
import { ParametersPopover } from './ParametersPopover'
import { getCumulativeResults } from './QueryBlock.utils'

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  type: 'bar',
  cumulative: false,
  xKey: '',
  yKey: '',
  showLabels: false,
  showGrid: false,
  view: 'table',
}

interface QueryBlockProps {
  /** Applicable if SQL is a snippet that's already saved (Used in Reports) */
  id?: string
  /** Title of the QueryBlock */
  label: string
  /** SQL query to render/run in the QueryBlock */
  sql?: string
  /** Configuration of the output chart based on the query result */
  chartConfig?: ChartConfig
  /** Not implemented yet: Will be the next part of ReportsV2 */
  parameterValues?: Record<string, string>
  /** Any other actions specific to the parent to be rendered in the header */
  actions?: ReactNode
  /** Toggle visiblity of SQL query on render */
  showSql?: boolean
  /** Indicate if SQL query can be rendered as a chart */
  isChart?: boolean
  /** For Assistant as QueryBlock is rendered while streaming response */
  isLoading?: boolean
  /** Override to prevent running the SQL query provided */
  runQuery?: boolean
  /** Prevent updating of columns for X and Y axes in the chart view */
  lockColumns?: boolean
  /** Max height set to render results / charts (Defaults to 250) */
  maxHeight?: number
  /** Whether query block is draggable */
  draggable?: boolean
  /** Tooltip when hovering over the header of the block (Used in Assistant Panel) */
  tooltip?: ReactNode
  /** Optional: Any initial results to render as part of the query*/
  results?: any[]
  /** Opt to show run button if query is not read only */
  showRunButtonIfNotReadOnly?: boolean
  /** Not implemented yet: Will be the next part of ReportsV2 */
  onSetParameter?: (params: Parameter[]) => void
  /** Optional callback the SQL query is run */
  onRunQuery?: (queryType: 'select' | 'mutation') => void
  /** Optional callback on drag start */
  onDragStart?: (e: DragEvent<Element>) => void
  /** Optional: callback when the results are returned from running the SQL query*/
  onResults?: (results: any[]) => void

  // [Joshen] Params below are currently only used by ReportsV2 (Might revisit to see how to improve these)
  /** Optional height set to render the SQL query (Used in Reports) */
  queryHeight?: number
  /** UI to render if there's a read-only error while running the query */
  readOnlyErrorPlaceholder?: ReactNode
  /** UI to render if there's no query results (Used in Reports) */
  noResultPlaceholder?: ReactNode
  /** To trigger a refresh of the query */
  isRefreshing?: boolean
  /** Optional callback whenever a chart configuration is updated (Used in Reports) */
  onUpdateChartConfig?: ({
    chart,
    chartConfig,
  }: {
    chart?: Partial<Dashboards.Chart>
    chartConfig: Partial<ChartConfig>
  }) => void
}

// [Joshen ReportsV2] JFYI we may adjust this in subsequent PRs when we implement this into Reports V2
// First iteration here is just to make this work with the AI Assistant first
export const QueryBlock = ({
  id,
  label,
  sql,
  chartConfig = DEFAULT_CHART_CONFIG,
  maxHeight = 250,
  queryHeight,
  parameterValues: extParameterValues,
  actions,
  showSql: _showSql = false,
  isChart = false,
  isLoading = false,
  runQuery = false,
  lockColumns = false,
  draggable = false,
  isRefreshing = false,
  noResultPlaceholder = null,
  readOnlyErrorPlaceholder = null,
  showRunButtonIfNotReadOnly = false,
  tooltip,
  results,
  onRunQuery,
  onSetParameter,
  onUpdateChartConfig,
  onDragStart,
  onResults,
}: QueryBlockProps) => {
  const { ref } = useParams()

  const [chartSettings, setChartSettings] = useState<ChartConfig>(chartConfig)
  const { xKey, yKey, view = 'table' } = chartSettings

  const [showSql, setShowSql] = useState(_showSql)
  const [readOnlyError, setReadOnlyError] = useState(false)
  const [queryError, setQueryError] = useState<QueryResponseError>()
  const [queryResult, setQueryResult] = useState<any[] | undefined>(results)
  const [focusDataIndex, setFocusDataIndex] = useState<number>()

  const formattedQueryResult = useMemo(() => {
    // Make sure Y axis values are numbers
    return queryResult?.map((row) => {
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
          if (key === yKey) return [key, Number(value)]
          else return [key, value]
        })
      )
    })
  }, [queryResult, yKey])

  const [parameterValues, setParameterValues] = useState<Record<string, string>>({})
  const [showWarning, setShowWarning] = useState<'hasWriteOperation' | 'hasUnknownFunctions'>()

  const parameters = useMemo(() => {
    if (!sql) return []
    return parseParameters(sql)
  }, [sql])
  // [Joshen] This is for when we introduced the concept of parameters into our reports
  // const combinedParameterValues = { ...extParameterValues, ...parameterValues }

  const { database: primaryDatabase } = usePrimaryDatabase({ projectRef: ref })
  const postgresConnectionString = primaryDatabase?.connectionString
  const readOnlyConnectionString = primaryDatabase?.connection_string_read_only

  const chartData = chartSettings.cumulative
    ? getCumulativeResults({ rows: formattedQueryResult ?? [] }, chartSettings)
    : formattedQueryResult

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: (data) => {
      onResults?.(data.result)
      setQueryResult(data.result)

      setReadOnlyError(false)
      setQueryError(undefined)
    },
    onError: (error) => {
      const permissionDenied = error.message.includes('permission denied')
      const notOwner = error.message.includes('must be owner')
      if (permissionDenied || notOwner) {
        setReadOnlyError(true)
        if (showRunButtonIfNotReadOnly) setShowWarning('hasWriteOperation')
      } else {
        setQueryError(error)
      }
    },
  })

  const getDateFormat = (key: any) => {
    const value = chartData?.[0]?.[key] || ''
    if (typeof value === 'number') return 'number'
    if (dayjs(value).isValid()) return 'date'
    return 'string'
  }
  const xKeyDateFormat = getDateFormat(xKey)

  const handleExecute = () => {
    if (!sql || isLoading) return

    if (readOnlyError) {
      return setShowWarning('hasWriteOperation')
    }

    try {
      // [Joshen] This is for when we introduced the concept of parameters into our reports
      // const processedSql = processParameterizedSql(sql, combinedParameterValues)
      execute({
        projectRef: ref,
        connectionString: readOnlyConnectionString,
        sql,
      })
    } catch (error: any) {
      toast.error(`Failed to execute query: ${error.message}`)
    }
  }

  useEffect(() => {
    setChartSettings(chartConfig)
  }, [chartConfig])

  // Run once on mount to parse parameters and notify parent
  useEffect(() => {
    if (!!sql && onSetParameter) {
      const params = parseParameters(sql)
      onSetParameter(params)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql])

  useEffect(() => {
    if (!!sql && !isLoading && runQuery && !!readOnlyConnectionString && !readOnlyError) {
      handleExecute()
    }
  }, [sql, isLoading, runQuery, readOnlyConnectionString])

  useEffect(() => {
    if (isRefreshing) handleExecute()
  }, [isRefreshing])

  return (
    <ReportBlockContainer
      draggable={draggable}
      showDragHandle={draggable}
      tooltip={tooltip}
      loading={isExecuting}
      onDragStart={(e: DragEvent<Element>) => onDragStart?.(e)}
      icon={
        <SQL_ICON
          size={18}
          strokeWidth={1.5}
          className={cn(
            'transition-colors fill-foreground-muted group-aria-selected:fill-foreground',
            'w-5 h-5 shrink-0 grow-0 -ml-0.5'
          )}
        />
      }
      label={label}
      actions={
        <>
          <ButtonTooltip
            type="text"
            size="tiny"
            className="w-7 h-7"
            icon={<Code size={14} />}
            onClick={() => setShowSql(!showSql)}
            tooltip={{
              content: { side: 'bottom', text: showSql ? 'Hide query' : 'Show query' },
            }}
          />

          {queryResult && (
            <>
              {/* [Joshen ReportsV2] Won't see this just yet as this is intended for Reports V2 */}
              {parameters.length > 0 && (
                <ParametersPopover
                  parameters={parameters}
                  parameterValues={parameterValues}
                  onSubmit={setParameterValues}
                />
              )}
              {isChart && (
                <BlockViewConfiguration
                  view={view}
                  isChart={isChart}
                  lockColumns={lockColumns}
                  chartConfig={chartSettings}
                  columns={Object.keys(queryResult[0] || {})}
                  changeView={(view) => {
                    if (onUpdateChartConfig) onUpdateChartConfig({ chartConfig: { view } })
                    setChartSettings({ ...chartSettings, view })
                  }}
                  updateChartConfig={(config) => {
                    if (onUpdateChartConfig) onUpdateChartConfig({ chartConfig: config })
                    setChartSettings(config)
                  }}
                />
              )}
            </>
          )}

          <EditQueryButton id={id} title={label} sql={sql} />

          {(showRunButtonIfNotReadOnly || !readOnlyError) && (
            <ButtonTooltip
              type="text"
              size="tiny"
              className="w-7 h-7"
              icon={<Play size={14} />}
              loading={isExecuting || isLoading}
              disabled={isLoading}
              onClick={() => {
                handleExecute()
                if (!!sql) onRunQuery?.('select')
              }}
              tooltip={{
                content: {
                  side: 'bottom',
                  className: 'max-w-56 text-center',
                  text: isExecuting ? (
                    <p>{`Query is running. You may cancel ongoing queries via the [SQL Editor](/project/${ref}/sql?viewOngoingQueries=true).`}</p>
                  ) : (
                    'Run query'
                  ),
                },
              }}
            />
          )}

          {actions}
        </>
      }
    >
      {!!showWarning && (
        <SqlWarningAdmonition
          warningType={showWarning}
          className="border-b"
          onCancel={() => setShowWarning(undefined)}
          onConfirm={() => {
            // [Joshen] This is for when we introduced the concept of parameters into our reports
            // const processedSql = processParameterizedSql(sql!, combinedParameterValues)
            if (sql) {
              setShowWarning(undefined)
              execute({
                projectRef: ref,
                connectionString: postgresConnectionString,
                sql,
              })
              onRunQuery?.('mutation')
            }
          }}
          disabled={!sql}
        />
      )}

      {isExecuting && queryResult === undefined && (
        <div className="p-3 w-full">
          <ShimmeringLoader />
        </div>
      )}

      {showSql && (
        <div
          className={cn('shrink-0 w-full max-h-96 overflow-y-auto', {
            'border-b': queryResult !== undefined,
          })}
          style={{ height: !!queryHeight ? `${queryHeight}px` : undefined }}
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

      {view === 'chart' && queryResult !== undefined ? (
        <>
          {(queryResult ?? []).length === 0 ? (
            <div className="flex w-full h-full items-center justify-center py-3">
              <p className="text-foreground-light text-xs">No results returned from query</p>
            </div>
          ) : !xKey || !yKey ? (
            <div className="flex w-full h-full items-center justify-center">
              <p className="text-foreground-light text-xs">Select columns for the X and Y axes</p>
            </div>
          ) : (
            <div className="flex-1 w-full">
              <ChartContainer
                className="aspect-auto px-3 py-2"
                style={{
                  height: maxHeight ? `${maxHeight}px` : undefined,
                  minHeight: maxHeight ? `${maxHeight}px` : undefined,
                }}
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
                  <YAxis tickLine={false} axisLine={false} tickMargin={4} />
                  <Tooltip content={<ChartTooltipContent className="w-[150px]" />} />
                  <Bar radius={1} dataKey={yKey}>
                    {chartData?.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        className="transition-all duration-100"
                        fill="var(--chart-1)"
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
          {!isExecuting && !!queryError ? (
            <div
              className={cn('flex-1 w-full overflow-auto relative border-t px-3.5 py-2')}
              style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
            >
              <span className="font-mono text-xs">ERROR: {queryError.message}</span>
            </div>
          ) : queryResult ? (
            <div
              className={cn('flex-1 w-full overflow-auto relative')}
              style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
            >
              <Results rows={queryResult} />
            </div>
          ) : !isExecuting ? (
            readOnlyError ? (
              readOnlyErrorPlaceholder
            ) : (
              noResultPlaceholder
            )
          ) : null}
        </>
      )}
    </ReportBlockContainer>
  )
}

import dayjs from 'dayjs'
import { Code, Play } from 'lucide-react'
import { DragEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ReportBlockContainer } from 'components/interfaces/Reports/ReportBlock/ReportBlockContainer'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { usePrimaryDatabase } from 'data/read-replicas/replicas-query'
import { type QueryResponseError, useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'

import { Badge, ChartContainer, ChartTooltipContent, cn, CodeBlock, SQL_ICON } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { ButtonTooltip } from '../ButtonTooltip'
import { CHART_COLORS } from '../Charts/Charts.constants'
import SqlWarningAdmonition from '../SqlWarningAdmonition'
import { BlockViewConfiguration } from './BlockViewConfiguration'
import { EditQueryButton } from './EditQueryButton'
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
  id?: string
  label: string
  sql?: string
  isWriteQuery?: boolean
  chartConfig?: ChartConfig
  actions?: ReactNode
  initialResults?: any[]
  onResults?: (results: any[]) => void
  onRunQuery?: (queryType: 'select' | 'mutation') => void
  onError?: (errorText: string) => void
  onUpdateChartConfig?: ({ chartConfig }: { chartConfig: Partial<ChartConfig> }) => void
  draggable?: boolean
  onDragStart?: (e: DragEvent<Element>) => void
  disabled?: boolean
  isExternallyExecuting?: boolean
}

// [Joshen ReportsV2] JFYI we may adjust this in subsequent PRs when we implement this into Reports V2
// First iteration here is just to make this work with the AI Assistant first
export const QueryBlock = ({
  id,
  label,
  sql,
  chartConfig = DEFAULT_CHART_CONFIG,
  actions,
  initialResults,
  isWriteQuery = false,
  onRunQuery,
  onUpdateChartConfig,
  onResults,
  onError,
  draggable = false,
  onDragStart,
  disabled = false,
  isExternallyExecuting = false,
}: QueryBlockProps) => {
  const { ref } = useParams()

  const [chartSettings, setChartSettings] = useState<ChartConfig>(chartConfig)
  const { xKey, yKey, view = 'table' } = chartSettings

  // Maintain local results state, seeded from initial results prop
  const [localResults, setLocalResults] = useState<any[] | undefined>(initialResults)

  const [showSql, setShowSql] = useState(!localResults)
  const [readOnlyError, setReadOnlyError] = useState(false)
  const [queryError, setQueryError] = useState<QueryResponseError>()
  const [focusDataIndex, setFocusDataIndex] = useState<number>()

  const formattedQueryResult = useMemo(() => {
    // Make sure Y axis values are numbers
    return localResults?.map((row) => {
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => {
          if (key === yKey) return [key, Number(value)]
          else return [key, value]
        })
      )
    })
  }, [localResults, yKey])

  const [showWarning, setShowWarning] = useState<'hasWriteOperation' | 'hasUnknownFunctions'>()

  const { database: primaryDatabase } = usePrimaryDatabase({ projectRef: ref })
  const postgresConnectionString = primaryDatabase?.connectionString
  const readOnlyConnectionString = primaryDatabase?.connection_string_read_only

  const chartData = chartSettings.cumulative
    ? getCumulativeResults({ rows: formattedQueryResult ?? [] }, chartSettings)
    : formattedQueryResult

  const { mutate: execute, isLoading: isInternallyExecuting } = useExecuteSqlMutation({
    onSuccess: (data) => {
      setLocalResults(data.result)
      onResults?.(data.result)

      setReadOnlyError(false)
      setQueryError(undefined)
    },
    onError: (error) => {
      const readOnlyTransaction = /cannot execute .+ in a read-only transaction/.test(error.message)
      const permissionDenied = error.message.includes('permission denied')
      const notOwner = error.message.includes('must be owner')
      if (readOnlyTransaction || permissionDenied || notOwner) {
        setReadOnlyError(true)
        setShowWarning('hasWriteOperation')
      } else {
        setQueryError(error)
      }
      onError?.(error.message)
    },
  })

  const getDateFormat = (key: any) => {
    const value = chartData?.[0]?.[key] || ''
    if (typeof value === 'number') return 'number'
    if (dayjs(value).isValid()) return 'date'
    return 'string'
  }
  const xKeyDateFormat = getDateFormat(xKey)

  // Combined loading state from internal execution or external execution
  const isExecuting = isInternallyExecuting || isExternallyExecuting

  const handleExecute = useCallback(() => {
    if (!sql || isExecuting) return

    if (readOnlyError || isWriteQuery) {
      return setShowWarning('hasWriteOperation')
    }

    try {
      execute({
        projectRef: ref,
        connectionString: readOnlyConnectionString,
        sql,
      })
    } catch (error: any) {
      toast.error(`Failed to execute query: ${error.message}`)
    }
  }, [sql, isExecuting, readOnlyError, isWriteQuery, execute, ref, readOnlyConnectionString])

  useEffect(() => {
    setChartSettings(chartConfig)
  }, [chartConfig])

  // Sync local results when initialResults changes (from external execution)
  useEffect(() => {
    if (initialResults !== undefined) {
      setLocalResults(initialResults)
    }
  }, [initialResults])

  // Execution is only user-driven within this component

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
            {localResults && (
              <BlockViewConfiguration
                view={view}
                isChart={view === 'chart'}
                lockColumns={false}
                chartConfig={chartSettings}
                columns={Object.keys(localResults?.[0] || {})}
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

            <EditQueryButton id={id} title={label} sql={sql} />
            <ButtonTooltip
              type="text"
              size="tiny"
              className="w-7 h-7"
              icon={<Play size={14} strokeWidth={1.5} />}
              loading={isExecuting}
              disabled={isExecuting}
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

            {actions}
          </>
        )
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
          className={cn('shrink-0 w-full max-h-96 overflow-y-auto', {
            'border-b': localResults !== undefined,
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

      {isExecuting && localResults === undefined && (
        <div className="p-3 w-full border-t">
          <ShimmeringLoader />
        </div>
      )}

      {view === 'chart' && localResults !== undefined ? (
        <>
          {(localResults ?? []).length === 0 ? (
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
                style={{ height: '250px', minHeight: '250px' }}
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
          {!isExecuting && !!queryError ? (
            <div className={cn('flex-1 w-full overflow-auto relative border-t px-3.5 py-2')}>
              <span className="font-mono text-xs">ERROR: {queryError.message}</span>
            </div>
          ) : (
            localResults && (
              <div className={cn('flex-1 w-full overflow-auto relative max-h-64')}>
                <Results rows={localResults} />
              </div>
            )
          )}
        </>
      )}
    </ReportBlockContainer>
  )
}

import { Code, Play } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import Results from 'components/interfaces/SQLEditor/UtilityPanel/Results'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { Parameter, parseParameters, processParameterizedSql } from 'lib/sql-parameters'
import {
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  cn,
  CodeBlock,
  SQL_ICON,
} from 'ui'
import { Admonition } from 'ui-patterns'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { containsUnknownFunction, isReadOnlySelect } from '../AIAssistantPanel/AIAssistant.utils'
import { ButtonTooltip } from '../ButtonTooltip'
import { BlockViewConfiguration } from './BlockViewConfiguration'
import { EditQueryButton } from './EditQueryButton'
import { ParametersPopover } from './ParametersPopover'
import { getCumulativeResults } from './QueryBlock.utils'

const DEFAULT_CHART_CONFIG: ChartConfig = {
  type: 'bar',
  cumulative: false,
  xKey: '',
  yKey: '',
  showLabels: false,
  showGrid: false,
}

interface QueryBlockProps {
  id?: string
  label: string
  sql: string
  chartConfig?: ChartConfig
  maxHeight?: number
  parameterValues?: Record<string, string>
  actions?: ReactNode // Any other actions specific to the parent to be rendered in the header
  isChart?: boolean
  isLoading?: boolean
  runQuery?: boolean
  lockColumns?: boolean
  onSetParameter?: (params: Parameter[]) => void
  onUpdateChartConfig?: (config: ChartConfig) => void
}

// [Joshen ReportsV2] JFYI we may adjust this in subsequent PRs when we implement this into Reports V2
// First iteration here is just to make this work with the AI Assistant first
export const QueryBlock = ({
  id,
  label,
  sql,
  chartConfig = DEFAULT_CHART_CONFIG,
  maxHeight = 250,
  parameterValues: extParameterValues,
  actions,
  isChart = false,
  isLoading = false,
  runQuery = false,
  lockColumns = false,
  onSetParameter,
  onUpdateChartConfig,
}: QueryBlockProps) => {
  const { ref } = useParams()
  const { project } = useProjectContext()

  const [showSql, setShowSql] = useState(!isChart)
  const [view, setView] = useState<'table' | 'chart'>(isChart ? 'chart' : 'table')
  // [Joshen] Thinking cumulative could just be a UI state here to prevent unnecessary re-rendering
  const [cumulative, setCumulative] = useState(false)
  const [queryResult, setQueryResult] = useState<any[]>()
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({})
  const [showWarning, setShowWarning] = useState<'hasWriteOperation' | 'hasUnknownFunctions'>()

  const { xKey, yKey } = chartConfig
  const showChart =
    isChart && (queryResult ?? []).length > 0 && !!xKey && !!yKey && view === 'chart'

  const parameters = useMemo(() => {
    if (!sql) return []
    return parseParameters(sql)
  }, [sql])
  const combinedParameterValues = { ...extParameterValues, ...parameterValues }

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: (data) => setQueryResult(data.result),
  })

  const handleExecute = () => {
    if (!sql || isLoading) return

    if (!isReadOnlySelect(sql)) {
      const hasUnknownFunctions = containsUnknownFunction(sql)
      return setShowWarning(hasUnknownFunctions ? 'hasUnknownFunctions' : 'hasWriteOperation')
    }

    try {
      const processedSql = processParameterizedSql(sql, combinedParameterValues)
      execute({
        projectRef: ref,
        connectionString: project?.connectionString,
        sql: processedSql,
      })
    } catch (error: any) {
      toast.error(`Failed to execute query: ${error.message}`)
    }
  }

  // Run once on mount to parse parameters and notify parent
  useEffect(() => {
    if (!!sql && onSetParameter) {
      const params = parseParameters(sql)
      onSetParameter(params)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql])

  useEffect(() => {
    if (!!sql && !isLoading && runQuery && isReadOnlySelect(sql) && !!project) {
      handleExecute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sql, isLoading, runQuery, project])

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface-100 border-overlay rounded border shadow-sm">
      <div className="flex py-1 pl-3 pr-1 items-center gap-2 z-10 shrink-0">
        <SQL_ICON
          className={cn(
            'transition-colors fill-foreground-muted group-aria-selected:fill-foreground',
            'w-5 h-5 shrink-0 grow-0 -ml-0.5'
          )}
          size={16}
          strokeWidth={1.5}
        />
        <h3 className="text-xs font-medium text-foreground-light flex-1">{label}</h3>

        {/* QueryBlock actions */}
        <div className="flex items-center">
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
                  chartConfig={{ ...chartConfig, cumulative }}
                  columns={Object.keys(queryResult[0] || {})}
                  changeView={setView}
                  updateChartConfig={(config) => {
                    if (onUpdateChartConfig) onUpdateChartConfig(config)
                    setCumulative(config.cumulative)
                  }}
                />
              )}
            </>
          )}

          <EditQueryButton title={label} sql={sql} />

          <ButtonTooltip
            type="text"
            size="tiny"
            className="w-7 h-7"
            icon={<Play size={14} />}
            loading={isExecuting || isLoading}
            disabled={isLoading}
            onClick={handleExecute}
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
        </div>
      </div>

      {showWarning && (
        <Admonition
          type="warning"
          className="mb-0 rounded-none border-0 shrink-0 bg-background-100 border-t"
        >
          <p>
            {showWarning === 'hasWriteOperation'
              ? 'This query contains write operations.'
              : 'This query involves running a function.'}{' '}
            Are you sure you want to execute it?
          </p>
          <p className="text-foreground-light">
            Make sure you are not accidentally removing something important.
          </p>
          <div className="flex justify-stretch mt-2 gap-2">
            <Button
              type="outline"
              size="tiny"
              className="w-full flex-1"
              onClick={() => setShowWarning(undefined)}
            >
              Cancel
            </Button>
            <Button
              type="danger"
              size="tiny"
              className="w-full flex-1"
              onClick={() => {
                // [Joshen] This is for when we introduced the concept of parameters into our reports
                // const processedSql = processParameterizedSql(sql!, combinedParameterValues)

                setShowWarning(undefined)
                execute({
                  projectRef: ref,
                  connectionString: project?.connectionString,
                  sql,
                })
              }}
            >
              Run
            </Button>
          </div>
        </Admonition>
      )}

      {/* QueryBlock output */}
      {showSql && (
        <div className="shrink-0 max-h-96 overflow-y-auto border-t">
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

      {isExecuting && queryResult === undefined && (
        <div className="border-t p-3">
          <ShimmeringLoader />
        </div>
      )}

      {showChart ? (
        <div className={cn('border-t flex-1 shrink-0')}>
          <ChartContainer
            className="aspect-auto p-3"
            config={{}}
            style={{
              height: maxHeight ? `${maxHeight}px` : undefined,
              minHeight: maxHeight ? `${maxHeight}px` : undefined,
            }}
          >
            <BarChart
              accessibilityLayer
              margin={{ left: 0, right: 0 }}
              data={
                cumulative
                  ? getCumulativeResults({ rows: queryResult ?? [] }, chartConfig)
                  : queryResult
              }
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={xKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip content={<ChartTooltipContent className="w-[150px]" />} />
              <Bar dataKey={yKey} fill="var(--chart-1)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      ) : (
        <>
          {queryResult && (
            <div
              className={cn('flex-1 overflow-auto relative border-t')}
              style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
            >
              <Results rows={queryResult} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

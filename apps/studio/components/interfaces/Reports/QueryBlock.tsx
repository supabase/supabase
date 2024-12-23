import { useParams } from 'common'
import { useEffect, useState, useCallback, useMemo } from 'react'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { X, Settings2, ArrowUpDown, Play, Code } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import Results from '../SQLEditor/UtilityPanel/Results'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  Label_Shadcn_,
  Checkbox_Shadcn_,
  ToggleGroup,
  ToggleGroupItem,
  Input_Shadcn_,
  cn,
  CodeBlock,
  SQL_ICON,
} from 'ui'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from 'ui'
import { CartesianGrid, Bar, BarChart, XAxis, YAxis } from 'recharts'
import dayjs from 'dayjs'
import { ChartConfig } from '../SQLEditor/UtilityPanel/ChartConfig'
import { BarChart2, Table } from 'lucide-react'
import { toast } from 'sonner'
import { parseParameters, processParameterizedSql, Parameter } from 'lib/sql-parameters'
import ParametersPopover from './ParametersPopover'
import {
  isReadOnlySelect,
  containsUnknownFunction,
} from 'components/ui/AIAssistantPanel/AIAssistant.utils'
import { Admonition } from 'ui-patterns'

// Add helper function for cumulative results
const getCumulativeResults = (results: { rows: any[] }, config: ChartConfig) => {
  if (!results?.rows?.length) {
    return []
  }

  const cumulativeResults = results.rows.reduce((acc, row) => {
    const prev = acc[acc.length - 1] || {}
    const next = {
      ...row,
      [config.yKey]: (prev[config.yKey] || 0) + row[config.yKey],
    }
    return [...acc, next]
  }, [])
  return cumulativeResults
}

// Add chart config type
const DEFAULT_CHART_CONFIG: ChartConfig = {
  type: 'bar',
  cumulative: false,
  xKey: '',
  yKey: '',
  showLabels: false,
  showGrid: false,
}

interface QueryBlockProps {
  sql: string
  isChart: boolean
  chartConfig?: ChartConfig
  results?: any
  label: string
  id: string
  disableUpdate: boolean
  onRemoveChart?: ({ metric }: { metric: { key: string } }) => void
  startDate?: string
  endDate?: string
  interval?: string
  onToggleChart: () => void
  onUpdateChartConfig: (config: ChartConfig) => void
  parameterValues?: Record<string, string>
  onSetParameter?: (params: Parameter[]) => void
  isLoading?: boolean
  maxHeight?: number
  actions?: React.ReactNode
  runQuery?: boolean
}

const QueryBlock = ({
  sql,
  isChart = false,
  chartConfig = DEFAULT_CHART_CONFIG,
  results,
  label,
  id,
  disableUpdate,
  onRemoveChart,
  startDate,
  endDate,
  interval,
  onToggleChart,
  onUpdateChartConfig,
  parameterValues: externalParameterValues,
  onSetParameter,
  isLoading = false,
  maxHeight,
  actions,
  runQuery = false,
}: QueryBlockProps) => {
  const { ref } = useParams()
  const { project } = useProjectContext()

  const [queryResult, setQueryResult] = useState<any>()
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({})
  const [showSql, setShowSql] = useState(false)
  const [showWarning, setShowWarning] = useState<'hasWriteOperation' | 'hasUnknownFunctions'>()

  const combinedParameterValues = { ...externalParameterValues, ...parameterValues }

  const handleSuccess = useCallback((data: any) => {
    setQueryResult(data.result)
  }, [])

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: handleSuccess,
  })

  const handleToggleChart = () => {
    onToggleChart()
  }

  const handleUpdateChartConfig = (config: ChartConfig) => {
    onUpdateChartConfig(config)
  }

  // Run once on mount to parse parameters and notify parent
  useEffect(() => {
    if (!sql) return
    const params = parseParameters(sql)
    if (onSetParameter) {
      onSetParameter(params)
    }
  }, [sql])

  const parameters = useMemo(() => {
    if (!sql) return []
    return parseParameters(sql)
  }, [sql])

  // Update handleParametersSubmit to work with Record type
  const handleParametersSubmit = (newParameters: Record<string, string>) => {
    setParameterValues(newParameters)
  }

  // Update execute call to include parameters
  const handleExecute = () => {
    if (!sql || isLoading) return

    if (!isReadOnlySelect(sql)) {
      const hasUnknownFunctions = containsUnknownFunction(sql)
      setShowWarning(hasUnknownFunctions ? 'hasUnknownFunctions' : 'hasWriteOperation')
      return
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

  useEffect(() => {
    if (!sql || isLoading) return

    if (runQuery && isReadOnlySelect(sql)) {
      handleExecute()
    }
  }, [sql, isLoading, runQuery])

  console.log('localParameters', label, parameterValues)

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface-100 border-overlay rounded border shadow-sm">
      <div className="flex pl-4 py-2 pr-2 items-center gap-2 z-10 shrink-0">
        <SQL_ICON
          className={cn(
            'transition-colors',
            'fill-foreground-muted',
            'group-aria-selected:fill-foreground',
            'w-5 h-5 shrink-0 grow-0',
            '-ml-0.5'
          )}
          size={16}
          strokeWidth={1.5}
        />
        <h3 className="text-sm text-foreground-light flex-1">{label}</h3>
        <div className="flex">
          <Button
            icon={<Code size={14} />}
            type="text"
            size="tiny"
            className="w-7 h-7"
            onClick={() => setShowSql(!showSql)}
          />
          {queryResult && (
            <>
              {parameters.length > 0 && (
                <ParametersPopover
                  parameters={parameters}
                  parameterValues={combinedParameterValues}
                  onSubmit={handleParametersSubmit}
                />
              )}

              <Popover_Shadcn_ modal={false}>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button
                    icon={<Settings2 size={14} />}
                    type="text"
                    size="tiny"
                    className="w-7 h-7"
                  />
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ side="bottom" align="end" className="w-[300px] p-3">
                  <form className="grid gap-2">
                    <ToggleGroup
                      type="single"
                      value={isChart ? 'chart' : 'table'}
                      className="w-full"
                      onValueChange={(value) => {
                        if (value) handleToggleChart()
                      }}
                    >
                      <ToggleGroupItem className="w-full" value="table" aria-label="Show as table">
                        <Table className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem className="w-full" value="chart" aria-label="Show as chart">
                        <BarChart2 className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>

                    {isChart && (
                      <>
                        <Select_Shadcn_
                          value={chartConfig?.xKey}
                          onValueChange={(value) =>
                            handleUpdateChartConfig({ ...chartConfig, xKey: value })
                          }
                        >
                          <SelectTrigger_Shadcn_>
                            X Axis {chartConfig?.xKey && `- ${chartConfig.xKey}`}
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectGroup_Shadcn_>
                              {Object.keys(queryResult[0] || {}).map((key) => (
                                <SelectItem_Shadcn_ value={key} key={key}>
                                  {key}
                                </SelectItem_Shadcn_>
                              ))}
                            </SelectGroup_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>

                        <Select_Shadcn_
                          value={chartConfig?.yKey}
                          onValueChange={(value) =>
                            handleUpdateChartConfig({ ...chartConfig, yKey: value })
                          }
                        >
                          <SelectTrigger_Shadcn_>
                            Y Axis {chartConfig?.yKey && `- ${chartConfig.yKey}`}
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            <SelectGroup_Shadcn_>
                              {Object.keys(queryResult[0] || {}).map((key) => (
                                <SelectItem_Shadcn_ value={key} key={key}>
                                  {key}
                                </SelectItem_Shadcn_>
                              ))}
                            </SelectGroup_Shadcn_>
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>

                        <div className="*:flex *:gap-2 *:items-center grid gap-2 *:text-foreground-light *:p-1.5 *:pl-0">
                          <Label_Shadcn_ htmlFor="cumulative">
                            <Checkbox_Shadcn_
                              id="cumulative"
                              checked={chartConfig?.cumulative}
                              onClick={() =>
                                handleUpdateChartConfig({
                                  ...chartConfig,
                                  cumulative: !chartConfig?.cumulative,
                                })
                              }
                            />
                            Cumulative
                          </Label_Shadcn_>
                        </div>
                      </>
                    )}
                  </form>
                </PopoverContent_Shadcn_>
              </Popover_Shadcn_>
            </>
          )}

          {actions}

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

          {!disableUpdate && onRemoveChart && (
            <ButtonTooltip
              type="text"
              size="tiny"
              icon={<X />}
              className="w-7 h-7"
              onClick={() => onRemoveChart({ metric: { key: id, id: id } })}
              tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
            />
          )}
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
                setShowWarning(undefined)
                const processedSql = processParameterizedSql(sql!, combinedParameterValues)
                execute({
                  projectRef: ref,
                  connectionString: project?.connectionString,
                  sql: processedSql,
                })
              }}
            >
              Run
            </Button>
          </div>
        </Admonition>
      )}
      {showSql && (
        <div className="shrink-0 max-h-96 overflow-y-auto border-t">
          <CodeBlock
            hideLineNumbers
            wrapLines={false}
            value={sql}
            language="sql"
            className={cn(
              'max-w-none block !bg-transparent !py-3 !px-3.5 prose dark:prose-dark border-0 border-t text-foreground !rounded-none w-full',
              '[&>code]:m-0 [&>code>span]:text-foreground'
            )}
          />
        </div>
      )}
      {isChart && queryResult && chartConfig?.xKey && chartConfig?.yKey ? (
        <div className={cn('flex-1 shrink-0 border-t p-4')}>
          <ChartContainer
            config={{}}
            className="aspect-auto h-full"
            style={{
              height: maxHeight ? `${maxHeight}px` : undefined,
              minHeight: maxHeight ? `${maxHeight}px` : undefined,
            }}
          >
            <BarChart
              accessibilityLayer
              data={
                chartConfig?.cumulative
                  ? getCumulativeResults({ rows: queryResult }, chartConfig)
                  : queryResult
              }
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={chartConfig?.xKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={chartConfig?.yKey} fill="var(--chart-1)" radius={4} />
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

export default QueryBlock

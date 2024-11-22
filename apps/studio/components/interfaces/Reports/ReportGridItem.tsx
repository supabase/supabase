import { useContentIdQuery } from 'data/content/content-id-query'
import { useParams } from 'common'
import { useEffect, useState, useCallback } from 'react'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { X, Settings2, ArrowUpDown, Play } from 'lucide-react'
import { Responsive, WidthProvider } from 'react-grid-layout'

import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { LAYOUT_COLUMN_COUNT } from './Reports.constants'
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

// Add helper function for date formatting
const getDateFormat = (value: any) => {
  if (typeof value === 'number') return 'number'
  if (dayjs(value).isValid()) return 'date'
  return 'string'
}

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

// Update layout item type
interface LayoutItem {
  id: string
  label: string
  sql?: string
  isSnippet?: boolean
  results?: any
  isChart?: boolean
  chartConfig?: ChartConfig
  // ... other existing fields ...
}

interface ReportGridItemProps {
  item: LayoutItem
  disableUpdate: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  startDate?: string
  endDate?: string
  interval?: string
  editableReport: any
  setEditableReport: (payload: any) => void
}

const ReportGridItem = ({
  item,
  disableUpdate,
  onRemoveChart,
  startDate,
  endDate,
  interval,
  editableReport,
  setEditableReport,
}: ReportGridItemProps) => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const state = useDatabaseSelectorStateSnapshot()

  const [sql, setSql] = useState<string>()
  const [queryResult, setQueryResult] = useState<any>()

  const { data: snippetData } = useContentIdQuery(
    { projectRef: ref, id: item.id },
    { enabled: item.isSnippet }
  )

  console.log('item', item, snippetData)

  useEffect(() => {
    if (snippetData?.content?.sql) {
      setSql(snippetData.content.sql)
    }
  }, [snippetData])

  const handleSuccess = useCallback((data: any) => {
    setQueryResult(data.result)
  }, [])

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: handleSuccess,
  })

  const onToggleChart = (item: LayoutItem) => {
    const updatedLayout = editableReport.layout.map((x: LayoutItem) => {
      if (x.id === item.id) {
        return {
          ...x,
          isChart: !x.isChart,
          chartConfig: x.chartConfig || DEFAULT_CHART_CONFIG,
        }
      }
      return x
    })
    setEditableReport({ ...editableReport, layout: updatedLayout })
  }

  const onUpdateChartConfig = (item: LayoutItem, config: ChartConfig) => {
    const updatedLayout = editableReport.layout.map((x: LayoutItem) => {
      if (x.id === item.id) {
        return { ...x, chartConfig: config }
      }
      return x
    })
    setEditableReport({ ...editableReport, layout: updatedLayout })
  }

  // Add effect to execute query when SQL is first loaded
  useEffect(() => {
    if (sql && !queryResult) {
      execute({
        projectRef: ref,
        connectionString: project?.connectionString,
        sql: sql,
      })
    }
  }, [sql, execute, project?.connectionString, ref])

  if (item.isSnippet) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between px-5 py-4 items-center z-10 border-b">
          <h3 className="text-sm text-foreground-light">{item.label}</h3>
          <div className="flex gap-2">
            {queryResult && (
              <Popover_Shadcn_ modal={false}>
                <PopoverTrigger_Shadcn_ asChild>
                  <Button
                    icon={<Settings2 size={14} />}
                    type="outline"
                    size="tiny"
                    className="w-7 h-7"
                  />
                </PopoverTrigger_Shadcn_>
                <PopoverContent_Shadcn_ side="bottom" align="end" className="w-[300px] p-4">
                  <form className="grid gap-2">
                    <ToggleGroup
                      type="single"
                      value={item.isChart ? 'chart' : 'table'}
                      className="w-full"
                      onValueChange={(value) => {
                        if (value) onToggleChart(item)
                      }}
                    >
                      <ToggleGroupItem className="w-full" value="table" aria-label="Show as table">
                        <Table className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem className="w-full" value="chart" aria-label="Show as chart">
                        <BarChart2 className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>

                    {item.isChart && (
                      <>
                        <Select_Shadcn_
                          value={item.chartConfig?.xKey}
                          onValueChange={(value) =>
                            onUpdateChartConfig(item, { ...item.chartConfig, xKey: value })
                          }
                        >
                          <SelectTrigger_Shadcn_>
                            X Axis {item.chartConfig?.xKey && `- ${item.chartConfig.xKey}`}
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
                          value={item.chartConfig?.yKey}
                          onValueChange={(value) =>
                            onUpdateChartConfig(item, { ...item.chartConfig, yKey: value })
                          }
                        >
                          <SelectTrigger_Shadcn_>
                            Y Axis {item.chartConfig?.yKey && `- ${item.chartConfig.yKey}`}
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
                              checked={item.chartConfig?.cumulative}
                              onClick={() =>
                                onUpdateChartConfig(item, {
                                  ...item.chartConfig,
                                  cumulative: !item.chartConfig?.cumulative,
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
            )}
            <Button
              onClick={() =>
                execute({
                  projectRef: ref,
                  connectionString: project?.connectionString,
                  sql: sql || '',
                })
              }
              loading={isExecuting}
              icon={<Play size={14} />}
              type="outline"
              size="tiny"
              className="w-7 h-7"
            />

            {!disableUpdate && (
              <ButtonTooltip
                type="outline"
                size="tiny"
                icon={<X />}
                className="w-7 h-7"
                onClick={() => onRemoveChart({ metric: { key: item.attribute, id: item.id } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            )}
          </div>
        </div>
        {item.isChart && queryResult && item.chartConfig?.xKey && item.chartConfig?.yKey ? (
          <div className="flex-1">
            <ChartContainer config={{}} className="aspect-auto h-full">
              <BarChart
                accessibilityLayer
                data={
                  item.chartConfig?.cumulative
                    ? getCumulativeResults({ rows: queryResult }, item.chartConfig)
                    : queryResult
                }
              >
                <CartesianGrid vertical={false} />
                {/* <XAxis
                  dataKey={item.chartConfig?.xKey}
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  hide={!item.chartConfig?.showLabels}
                  tickFormatter={(value) => {
                    if (getDateFormat(value) === 'date') {
                      return dayjs(value).format('MMM D YYYY')
                    }
                    return value
                  }}
                />
                <YAxis
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  hide={!item.chartConfig?.showLabels}
                  tickFormatter={(value) => value.toLocaleString()}
                /> */}
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey={item.chartConfig?.yKey} fill="var(--chart-1)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <>{queryResult && <Results rows={queryResult} />}</>
        )}
      </div>
    )
  }

  return (
    <ChartHandler
      startDate={startDate}
      endDate={endDate}
      interval={interval}
      attribute={item.attribute}
      provider={item.provider}
      label={`${item.label}${ref !== state.selectedDatabaseId ? (item.provider === 'infra-monitoring' ? ' of replica' : ' on project') : ''}`}
      customDateFormat={'MMM D, YYYY'}
    >
      {!disableUpdate && (
        <ButtonTooltip
          type="outline"
          icon={<X />}
          className="w-7 h-7"
          onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
          tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
        />
      )}
    </ChartHandler>
  )
}

export default ReportGridItem

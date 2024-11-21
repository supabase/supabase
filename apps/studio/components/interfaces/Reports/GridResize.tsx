import { X, Settings2, ArrowUpDown } from 'lucide-react'
import RGL, { WidthProvider } from 'react-grid-layout'

import { useParams } from 'common'
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
} from 'ui'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useCallback } from 'react'
import BarChart from 'components/ui/Charts/BarChart'
import dayjs from 'dayjs'

const ReactGridLayout = WidthProvider(RGL)

interface GridResizeProps {
  startDate: string
  endDate: string
  interval: string
  editableReport: any
  disableUpdate: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  setEditableReport: (payload: any) => void
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

const GridResize = ({
  startDate,
  endDate,
  interval,
  editableReport,
  disableUpdate,
  onRemoveChart,
  setEditableReport,
}: GridResizeProps) => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  const state = useDatabaseSelectorStateSnapshot()

  const handleSuccess = useCallback(
    (data: any, vars: any) => {
      const updatedLayout = editableReport.layout.map((item: LayoutItem) => {
        if (item.sql === vars.sql) {
          return { ...item, results: data.result }
        }
        return item
      })

      console.log('data', updatedLayout)

      setEditableReport({
        ...editableReport,
        layout: updatedLayout,
      })
    },
    [editableReport, setEditableReport]
  )

  const { mutate: execute, isLoading: isExecuting } = useExecuteSqlMutation({
    onSuccess: handleSuccess,
  })

  // Add function to toggle chart mode
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

  // Add function to update chart config
  const onUpdateChartConfig = (item: LayoutItem, config: ChartConfig) => {
    const updatedLayout = editableReport.layout.map((x: LayoutItem) => {
      if (x.id === item.id) {
        return { ...x, chartConfig: config }
      }
      return x
    })
    setEditableReport({ ...editableReport, layout: updatedLayout })
  }

  function onLayoutChange(layout: any) {
    let updatedLayout = editableReport.layout
    layout.map((item: any) => {
      const index = updatedLayout.findIndex((x: any) => x.id === item.i)
      updatedLayout[index].w = layout[index].w
      updatedLayout[index].h = layout[index].h
      updatedLayout[index].x = layout[index].x
      updatedLayout[index].y = layout[index].y
    })
    const payload = {
      ...editableReport,
      layout: updatedLayout,
    }
    setEditableReport(payload)
  }

  if (!editableReport) return null

  console.log('editableReport', editableReport)

  return (
    <>
      <ReactGridLayout
        autoSize={true}
        layout={editableReport}
        onLayoutChange={(layout) => onLayoutChange(layout)}
        rowHeight={60}
        cols={LAYOUT_COLUMN_COUNT}
        containerPadding={[0, 0]}
        compactType="horizontal"
      >
        {editableReport.layout.map((x: LayoutItem) => {
          return (
            <div
              key={x.id}
              data-grid={{ ...x, minH: 4, maxH: 4, minW: 8 }}
              className="react-grid-layout__report-item bg-surface-100 border-overlay group relative rounded border px-6 py-4 shadow-sm hover:border-green-900"
            >
              {x.isSnippet ? (
                <div className="h-full overflow-auto">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-sm text-foreground-light">{x.label}</h3>
                    <div className="flex gap-2">
                      <Popover_Shadcn_ modal={false}>
                        <PopoverTrigger_Shadcn_ asChild>
                          <Button type="text" size="small">
                            <div className="flex items-center gap-2">
                              <Settings2 size={14} />
                              Configure
                            </div>
                          </Button>
                        </PopoverTrigger_Shadcn_>
                        <PopoverContent_Shadcn_ side="bottom" align="end" className="w-[400px] p-4">
                          <form className="grid gap-4">
                            <div className="flex justify-between items-center">
                              <h2 className="text-sm text-foreground-lighter">Display options</h2>
                            </div>

                            <div className="flex items-center gap-2">
                              <Label_Shadcn_ htmlFor="chartToggle">
                                <Checkbox_Shadcn_
                                  id="chartToggle"
                                  checked={x.isChart}
                                  onClick={() => onToggleChart(x)}
                                />
                                Show as chart
                              </Label_Shadcn_>
                            </div>

                            {x.isChart && (
                              <>
                                <div className="flex justify-between items-center mt-2">
                                  <h2 className="text-sm text-foreground-lighter">Chart options</h2>
                                  {x.chartConfig?.xKey && x.chartConfig?.yKey && (
                                    <Button
                                      type="text"
                                      onClick={() =>
                                        onUpdateChartConfig(x, {
                                          ...x.chartConfig,
                                          xKey: x.chartConfig.yKey,
                                          yKey: x.chartConfig.xKey,
                                        })
                                      }
                                      title="Swap X and Y axis"
                                      icon={
                                        <ArrowUpDown
                                          size="15"
                                          className="text-foreground-lighter"
                                        />
                                      }
                                    >
                                      Flip
                                    </Button>
                                  )}
                                </div>

                                <Select_Shadcn_
                                  value={x.chartConfig?.xKey}
                                  onValueChange={(value) =>
                                    onUpdateChartConfig(x, { ...x.chartConfig, xKey: value })
                                  }
                                >
                                  <SelectTrigger_Shadcn_>
                                    X Axis {x.chartConfig?.xKey && `- ${x.chartConfig.xKey}`}
                                  </SelectTrigger_Shadcn_>
                                  <SelectContent_Shadcn_>
                                    <SelectGroup_Shadcn_>
                                      {Object.keys(x.results[0] || {}).map((key) => (
                                        <SelectItem_Shadcn_ value={key} key={key}>
                                          {key}
                                        </SelectItem_Shadcn_>
                                      ))}
                                    </SelectGroup_Shadcn_>
                                  </SelectContent_Shadcn_>
                                </Select_Shadcn_>

                                <Select_Shadcn_
                                  value={x.chartConfig?.yKey}
                                  onValueChange={(value) =>
                                    onUpdateChartConfig(x, { ...x.chartConfig, yKey: value })
                                  }
                                >
                                  <SelectTrigger_Shadcn_>
                                    Y Axis {x.chartConfig?.yKey && `- ${x.chartConfig.yKey}`}
                                  </SelectTrigger_Shadcn_>
                                  <SelectContent_Shadcn_>
                                    <SelectGroup_Shadcn_>
                                      {Object.keys(x.results[0] || {}).map((key) => (
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
                                      checked={x.chartConfig?.cumulative}
                                      onClick={() =>
                                        onUpdateChartConfig(x, {
                                          ...x.chartConfig,
                                          cumulative: !x.chartConfig?.cumulative,
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
                      <Button
                        type="text"
                        onClick={() =>
                          execute({
                            projectRef: ref,
                            connectionString: project?.connectionString,
                            sql: x.sql || '',
                          })
                        }
                        loading={isExecuting}
                      >
                        Run
                      </Button>
                      {!disableUpdate && (
                        <ButtonTooltip
                          type="text"
                          icon={<X />}
                          className="ml-2 px-1"
                          onClick={() => onRemoveChart({ metric: { key: x.attribute, id: x.id } })}
                          tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
                        />
                      )}
                    </div>
                  </div>
                  {x.isChart && x.results ? (
                    <div className="h-full">
                      <BarChart
                        showLegend
                        size="normal"
                        xAxisIsDate={
                          getDateFormat(x.results[0]?.[x.chartConfig?.xKey || '']) === 'date'
                        }
                        data={
                          x.chartConfig?.cumulative
                            ? getCumulativeResults({ rows: x.results }, x.chartConfig)
                            : x.results
                        }
                        xAxisKey={x.chartConfig?.xKey}
                        yAxisKey={x.chartConfig?.yKey}
                        showGrid={x.chartConfig?.showGrid}
                        XAxisProps={{
                          angle: 0,
                          interval: 0,
                          hide: !x.chartConfig?.showLabels,
                          tickFormatter: (idx: string) => {
                            const value = x.results[+idx][x.chartConfig?.xKey || '']
                            if (getDateFormat(value) === 'date') {
                              return dayjs(value).format('MMM D YYYY')
                            }
                            return value
                          },
                        }}
                        YAxisProps={{
                          tickFormatter: (value: number) => value.toLocaleString(),
                          label: <></>,
                          hide: !x.chartConfig?.showLabels,
                        }}
                      />
                    </div>
                  ) : (
                    <>{x.results && <Results rows={x.results} />}</>
                  )}
                </div>
              ) : (
                <ChartHandler
                  startDate={startDate}
                  endDate={endDate}
                  interval={interval}
                  attribute={x.attribute}
                  provider={x.provider}
                  label={`${x.label}${ref !== state.selectedDatabaseId ? (x.provider === 'infra-monitoring' ? ' of replica' : ' on project') : ''}`}
                  customDateFormat={'MMM D, YYYY'}
                >
                  {!disableUpdate && (
                    <ButtonTooltip
                      type="text"
                      icon={<X />}
                      className="ml-2 px-1"
                      onClick={() => onRemoveChart({ metric: { key: x.attribute } })}
                      tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
                    />
                  )}
                </ChartHandler>
              )}
            </div>
          )
        })}
      </ReactGridLayout>
    </>
  )
}

export default GridResize

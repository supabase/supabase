import { ArrowUpDown, BarChart2 } from 'lucide-react'
import { useMemo } from 'react'
import type { ChartConfig as RechartsChartConfig } from 'ui'
import { Checkbox, Label, Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from 'ui'
import {
  Chart,
  ChartBar,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartLine,
  ChartLoadingState,
} from 'ui-patterns/Chart'

import { SqlEditorAwaitingResultsEmptyState } from './SqlEditorAwaitingResultsEmptyState'
import {
  getCumulativeSqlChartRows,
  getSqlEditorDateTimeFormat,
  getSqlEditorResultKeys,
  getSqlEditorXKeyFormat,
  getSqlEditorYAxisKeys,
  shouldShowSqlChartXLabel,
  sqlRowsToChartTicks,
  type SqlChartTick,
  type SqlEditorChartConfig,
} from './sqlEditorChart.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export type { SqlEditorChartConfig as ChartConfig }

type Results = { rows: readonly Record<string, unknown>[] }

type ChartConfigProps = {
  results?: Results
  config: SqlEditorChartConfig
  isLoading?: boolean
}

type ChartSettingsProps = ChartConfigProps & {
  onConfigChange: (config: SqlEditorChartConfig) => void
}

export const ChartConfig = ({
  results = { rows: [] },
  config,
  isLoading = false,
}: ChartConfigProps) => {
  const resultKeys = useMemo(() => getSqlEditorResultKeys(results), [results])

  const hasConfig = Boolean(config.xKey && config.yKey)

  const rowsToPlot = useMemo(() => {
    const baseRows = config.cumulative ? getCumulativeSqlChartRows(results, config) : results.rows
    if (!hasConfig || !baseRows.length) return []

    const xKeyFormat = getSqlEditorXKeyFormat(baseRows[0]?.[config.xKey])
    return sqlRowsToChartTicks(baseRows, config.xKey, config.yKey, xKeyFormat)
  }, [config, hasConfig, results])

  const xKeyFormat = useMemo(() => {
    if (!hasConfig || !rowsToPlot.length) return 'string' as const
    return getSqlEditorXKeyFormat(results.rows[0]?.[config.xKey])
  }, [config.xKey, hasConfig, results.rows, rowsToPlot.length])

  const rechartsConfig = useMemo<RechartsChartConfig>(
    () => ({
      [config.yKey]: {
        label: config.yKey,
        color: 'hsl(var(--brand-default))',
      },
    }),
    [config.yKey]
  )

  const dateTimeFormat = getSqlEditorDateTimeFormat(xKeyFormat)
  const showXLabelInTooltip = shouldShowSqlChartXLabel(xKeyFormat)

  const yAxisProps = {
    tickFormatter: (value: number) => value.toLocaleString(),
    width: config.showLabels ? 72 : 0,
  }

  if (!resultKeys.length) {
    return (
      <Chart isLoading={isLoading} className="h-full min-h-0">
        <ChartCard asChild>
          <ChartContent
            className="flex h-full min-h-0 flex-1 flex-col"
            isEmpty
            emptyState={<SqlEditorAwaitingResultsEmptyState />}
            loadingState={<ChartLoadingState />}
          />
        </ChartCard>
      </Chart>
    )
  }

  return (
    <Chart isLoading={isLoading} className="h-full min-h-0">
      <ChartCard asChild>
        <ChartContent
          className="flex h-full min-h-0 flex-1 flex-col"
          isEmpty={!hasConfig || rowsToPlot.length === 0}
          emptyState={
            !hasConfig ? (
              <ChartEmptyState
                icon={<BarChart2 size={16} />}
                title="Configure your chart"
                description="Select your X and Y axis in chart settings."
              />
            ) : (
              <ChartEmptyState
                icon={<BarChart2 size={16} />}
                title="No data to show"
                description="The query returned no rows to chart."
              />
            )
          }
          loadingState={<ChartLoadingState />}
        >
          <div className="min-h-[160px] flex-1">
            {config.type === 'line' ? (
              <ChartLine
                data={rowsToPlot}
                dataKey={config.yKey}
                config={rechartsConfig}
                showGrid={config.showGrid}
                showYAxis={config.showLabels}
                isFullHeight
                DateTimeFormat={dateTimeFormat}
                YAxisProps={yAxisProps}
                tooltipDetails={
                  showXLabelInTooltip
                    ? (datum: SqlChartTick) => (
                        <span className="text-foreground-lighter text-xs">{datum._xLabel}</span>
                      )
                    : undefined
                }
              />
            ) : (
              <ChartBar
                data={rowsToPlot}
                dataKey={config.yKey}
                config={rechartsConfig}
                showGrid={config.showGrid}
                showYAxis={config.showLabels}
                isFullHeight
                DateTimeFormat={dateTimeFormat}
                YAxisProps={yAxisProps}
              />
            )}
          </div>
        </ChartContent>
      </ChartCard>
    </Chart>
  )
}

export const ChartSettings = ({
  results = { rows: [] },
  config,
  onConfigChange,
}: ChartSettingsProps) => {
  const resultKeys = useMemo(() => getSqlEditorResultKeys(results), [results])
  const yAxisKeys = useMemo(() => getSqlEditorYAxisKeys(results), [results])

  const canFlip = useMemo(() => {
    if (!config.xKey || !config.yKey) return false
    const xKeyType = typeof results.rows[0]?.[config.xKey]
    const yKeyType = typeof results.rows[0]?.[config.yKey]
    return xKeyType === 'number' && yKeyType === 'number'
  }, [results.rows, config.xKey, config.yKey])

  const onFlip = () => {
    onConfigChange({ ...config, xKey: config.yKey, yKey: config.xKey })
  }

  if (!resultKeys.length) {
    return <p className="text-sm text-foreground-light">Execute a query to configure a chart.</p>
  }

  return (
    <form className="grid gap-3">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <h2 className="text-sm text-foreground-lighter">Chart options</h2>
        {config.xKey && config.yKey && (
          <ButtonTooltip
            type="text"
            size="tiny"
            onClick={onFlip}
            disabled={!canFlip}
            icon={<ArrowUpDown size="15" className="text-foreground-lighter" />}
            tooltip={{
              content: {
                side: 'bottom',
                className: 'w-64 text-center',
                text: canFlip
                  ? 'Swap X and Y axis'
                  : 'Unable to swap X and Y axis - both axes need to numerical values',
              },
            }}
          >
            Flip
          </ButtonTooltip>
        )}
      </div>

      <div>
        <Label className="text-xs text-foreground-light">X Axis</Label>
        <Select
          value={config.xKey}
          onValueChange={(value) => {
            onConfigChange({ ...config, xKey: value })
          }}
        >
          <SelectTrigger className="text-left">{config.xKey || 'Select X Axis'}</SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {resultKeys.map((key) => (
                <SelectItem value={key} key={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-foreground-light">Y Axis</Label>
        <Select
          value={config.yKey}
          onValueChange={(value) => {
            onConfigChange({ ...config, yKey: value })
          }}
        >
          <SelectTrigger className="text-left">{config.yKey || 'Select Y Axis'}</SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {yAxisKeys.map((key) => (
                <SelectItem value={key} key={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="*:flex *:items-center *:gap-2 grid gap-2 *:p-1.5 *:pl-0 *:text-foreground-light">
        <Label htmlFor="cumulative">
          <Checkbox
            id="cumulative"
            name="cumulative"
            checked={config.cumulative}
            onClick={() => onConfigChange({ ...config, cumulative: !config.cumulative })}
          />
          Cumulative
        </Label>

        <Label htmlFor="showLabels">
          <Checkbox
            id="showLabels"
            name="showLabels"
            checked={config.showLabels}
            onClick={() => onConfigChange({ ...config, showLabels: !config.showLabels })}
          />
          Show labels
        </Label>

        <Label htmlFor="showGrid">
          <Checkbox
            id="showGrid"
            name="showGrid"
            checked={config.showGrid}
            onClick={() => onConfigChange({ ...config, showGrid: !config.showGrid })}
          />
          Show grid
        </Label>
      </div>
    </form>
  )
}

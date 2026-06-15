import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { ArrowUpDown, BarChart2, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  cn,
  Label,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import {
  Chart,
  ChartBar,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartLine,
} from 'ui-patterns/Chart'

import {
  getSqlEditorChartDateTimeFormat,
  guessChartAxisKeys,
  isSqlEditorChartXAxisDate,
  mapSqlRowsToChartTicks,
  shouldAutoConfigureChartAxes,
} from './ChartConfig.utils'
import { SqlEditorResultsEmptyState } from './SqlEditorResultsEmptyState'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

type Results = { rows: readonly any[] }

export type ChartConfig = {
  view?: 'table' | 'chart'
  type: 'bar' | 'line'
  cumulative: boolean
  xKey: string
  yKey: string
  showLabels?: boolean
  showGrid?: boolean
  logScale?: boolean
}

const getCumulativeResults = (results: Results, config: ChartConfig) => {
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
const VALID_RESULT_KEY_TYPES = ['number', 'string', 'date']

type ChartConfigProps = {
  results: Results
  config: ChartConfig
  onConfigChange: (config: ChartConfig) => void
}

export const ChartConfig = ({
  results = { rows: [] },
  config,
  onConfigChange,
}: ChartConfigProps) => {
  const { ref } = useParams()

  const [acknowledged, setAcknowledged] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_SQL_BLOCK_ACKNOWLEDGED(ref as string),
    false
  )

  // If a result key is not valid, it will be filtered out
  const resultKeys = useMemo(() => {
    return Object.keys(results.rows[0] || {}).filter((key) => {
      const type = typeof results.rows[0][key]
      return VALID_RESULT_KEY_TYPES.includes(type)
    })
  }, [results])

  // Only allow Y-axis keys that are numbers
  const yAxisKeys = useMemo(() => {
    if (!results.rows[0]) return []
    return Object.keys(results.rows[0]).filter((key) => {
      const value = results.rows[0][key]
      return typeof value === 'number' || !isNaN(Number(value))
    })
  }, [results])

  useEffect(() => {
    if (!shouldAutoConfigureChartAxes(results.rows, config)) return

    const guessed = guessChartAxisKeys(results.rows)
    if (!guessed) return

    onConfigChange({ ...config, ...guessed })
    // Only re-guess when the result shape or saved axis keys change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.rows, config.xKey, config.yKey])

  const hasConfig = config.xKey && config.yKey

  const canFlip = useMemo(() => {
    if (!hasConfig) return false
    const xKeyType = typeof results.rows[0]?.[config.xKey]
    const yKeyType = typeof results.rows[0]?.[config.yKey]
    return xKeyType === 'number' && yKeyType === 'number'
  }, [hasConfig, results.rows, config.xKey, config.yKey])

  // Compute cumulative results only if necessary
  const cumulativeResults = useMemo(() => getCumulativeResults(results, config), [results, config])

  const resultToRender = config.cumulative ? cumulativeResults : results.rows

  const xAxisIsDate = useMemo(
    () => isSqlEditorChartXAxisDate(config.xKey, resultToRender),
    [config.xKey, resultToRender]
  )

  const chartData = useMemo(
    () => mapSqlRowsToChartTicks(resultToRender, config.xKey, config.yKey),
    [config.xKey, config.yKey, resultToRender]
  )

  const chartDateTimeFormat = useMemo(
    () => getSqlEditorChartDateTimeFormat(config.xKey, resultToRender),
    [config.xKey, resultToRender]
  )

  const chartConfig = useMemo(
    () => ({
      [config.yKey]: {
        label: config.yKey,
        color: 'hsl(var(--brand-default))',
      },
    }),
    [config.yKey]
  )

  const onFlip = () => {
    const newY = config.xKey
    const newX = config.yKey
    onConfigChange({ ...config, xKey: newX, yKey: newY })
  }

  if (!resultKeys.length) {
    return <SqlEditorResultsEmptyState />
  }

  const configureChartEmptyState = (
    <ChartEmptyState
      className="h-full w-full"
      icon={<BarChart2 size={16} />}
      title="Configure your chart"
      description="Select your X and Y axis in the chart options panel"
    />
  )

  const chartVisualization =
    config.type === 'line' ? (
      <ChartLine
        data={chartData}
        dataKey={config.yKey}
        config={chartConfig}
        DateTimeFormat={chartDateTimeFormat}
        isFullHeight
        showGrid={config.showGrid}
        showYAxis={config.showLabels}
        className={cn(
          'h-full',
          !xAxisIsDate && '[&_[data-testid=chart-line]>div:last-child]:hidden'
        )}
        YAxisProps={{
          tickFormatter: (value: number) => value.toLocaleString(),
          width: config.showLabels ? 80 : undefined,
        }}
      />
    ) : (
      <ChartBar
        data={chartData}
        dataKey={config.yKey}
        config={chartConfig}
        DateTimeFormat={chartDateTimeFormat}
        isFullHeight
        showGrid={config.showGrid}
        showYAxis={config.showLabels}
        className={cn(
          'h-full',
          !xAxisIsDate && '[&_[data-testid=chart-bar]>div:last-child]:hidden'
        )}
        YAxisProps={{
          tickFormatter: (value: number) => value.toLocaleString(),
          width: config.showLabels ? 80 : undefined,
        }}
      />
    )

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full min-h-0">
      <ResizablePanel defaultSize="75" minSize="40" className="min-h-0">
        <Chart className="flex h-full min-h-0 flex-col">
          <ChartCard asChild>
            <div className="flex h-full min-h-0 flex-col">
              <ChartContent
                className="flex min-h-0 flex-1 flex-col p-4"
                isEmpty={!hasConfig}
                emptyState={configureChartEmptyState}
              >
                <div className="min-h-0 flex-1">{chartVisualization}</div>
              </ChartContent>
            </div>
          </ChartCard>
        </Chart>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="25" minSize="15" className="space-y-4 overflow-y-auto px-3 py-3">
        <div className="flex h-5 items-center justify-between">
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

        {!acknowledged && (
          <Admonition showIcon={false} type="tip" className="group relative p-2">
            <Tooltip>
              <TooltipTrigger
                onClick={() => setAcknowledged(true)}
                className="absolute right-3 top-3 opacity-30 transition-opacity group-hover:opacity-100"
              >
                <X size={14} className="text-foreground-light" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Dismiss</TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-x-2">
              <Badge variant="success">New</Badge>
              <p className="text-xs">Add this chart to custom reports</p>
            </div>
            <p className="mt-1! text-xs text-foreground-light">
              SQL snippets can now be added and saved to your custom reports. Try it out now!
            </p>
            <Button asChild size="tiny" type="default" className="mt-1">
              <Link href={`/project/${ref}/reports`}>Head to Reports</Link>
            </Button>
          </Admonition>
        )}

        <div>
          <Label className="text-xs text-foreground-light">X Axis</Label>
          <Select
            value={config.xKey}
            onValueChange={(value) => {
              onConfigChange({ ...config, xKey: value })
            }}
          >
            <SelectTrigger>{config.xKey || 'Select X Axis'}</SelectTrigger>
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
            <SelectTrigger>{config.yKey || 'Select Y Axis'}</SelectTrigger>
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
        <div className="grid gap-2 *:flex *:items-center *:gap-2 *:p-1.5 *:pl-0 *:text-foreground-light">
          <Label className="" htmlFor="cumulative">
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
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

import { BarChart2, LineChart, Settings2, Table } from 'lucide-react'
import { useEffect, useEffectEvent, useMemo } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'

import { ExplorerToolbarAction } from '../ExplorerToolbar'
import { type QueryDisplay, type QueryResult } from '../types'
import { checkHasNonPositiveValues } from '@/components/ui/QueryBlock/QueryBlock.utils'
import { MAX_CHART_Y_SERIES, type ChartConfig } from '@/data/content/notebooks/notebook-schema'

interface DisplaySettingsButtonProps {
  display: QueryDisplay
  result?: QueryResult
  columns: string[]
  disabled: boolean
  onChange: (display: QueryDisplay) => void
}

const getLogScaleDisabledReason = (y_series: string[]) => {
  if (y_series.length === 0) return 'Select a column for the Y axis first'
  if (y_series.length > 1) return 'Only available with a single Y axis column'
  return 'Data contains zero or negative values'
}

export const DisplaySettingsButton = ({
  display,
  result,
  columns,
  disabled,
  onChange,
}: DisplaySettingsButtonProps) => {
  const { view, chart } = display
  const {
    type = 'bar',
    x_column,
    y_series = [],
    cumulative = false,
    show_labels = false,
    scale = 'linear',
  } = chart ?? {}

  const hasNonPositiveValues = useMemo(
    () => checkHasNonPositiveValues(result?.rows ?? [], y_series[0]),
    [result, y_series]
  )

  // Logarithmic scale only applies to a single series.
  const canToggleLogScale = useMemo(() => {
    if (y_series.length !== 1 || !result || (result.rows ?? []).length === 0) return false
    return !hasNonPositiveValues
  }, [hasNonPositiveValues, result, y_series.length])

  const onChangeView = (view: 'table' | 'chart') => {
    onChange({ ...display, view })
  }

  const onUpdateChartConfig = (payload: Partial<ChartConfig>) => {
    onChange({
      ...display,
      chart: {
        type: chart?.type ?? 'bar',
        x_column: chart?.x_column ?? '',
        y_series: chart?.y_series ?? [],
        cumulative: chart?.cumulative ?? false,
        scale: chart?.scale ?? 'linear',
        show_labels: chart?.show_labels ?? false,
        ...payload,
      },
    })
  }

  const resetToLinearScale = useEffectEvent(() => {
    onUpdateChartConfig({ scale: 'linear' })
  })

  useEffect(() => {
    if (scale === 'log' && (hasNonPositiveValues || y_series.length > 1)) {
      resetToLinearScale()
    }
  }, [hasNonPositiveValues, scale, y_series.length])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ExplorerToolbarAction
          disabled={disabled}
          icon={<Settings2 size={16} strokeWidth={2} />}
          tooltip="Result settings"
        />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        aria-label="Result display settings"
        className="mr-8 flex w-80 flex-col p-3"
      >
        <div className="flex flex-col gap-y-2.5">
          <ToggleGroup
            value={view}
            onValueChange={(value) => {
              if (value === 'table' || value === 'chart') onChangeView(value)
            }}
            aria-label="View result as"
            variant="outline"
            size="tiny"
            type="single"
            className="w-full"
          >
            <ToggleGroupItem value="table" className="w-full gap-2">
              <Table size={14} />
              <span>Table</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="chart" className="w-full gap-2">
              <BarChart2 size={14} />
              <span>Chart</span>
            </ToggleGroupItem>
          </ToggleGroup>

          {view === 'chart' && (
            <div className="flex min-w-0 flex-col gap-y-2.5">
              <FormItemLayout
                isReactForm={false}
                layout="horizontal"
                size="tiny"
                label="Chart type"
              >
                <ToggleGroup
                  value={type}
                  onValueChange={(value) => {
                    if (value === 'bar' || value === 'line') onUpdateChartConfig({ type: value })
                  }}
                  aria-label="Chart type"
                  variant="default"
                  size="tiny"
                  type="single"
                  className="w-full"
                >
                  <ToggleGroupItem value="bar" className="w-full gap-2">
                    <BarChart2 size={14} />
                    <span>Bar</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="line" className="w-full gap-2">
                    <LineChart size={14} />
                    <span>Line</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </FormItemLayout>

              <FormItemLayout
                id="result-x-axis"
                isReactForm={false}
                layout="horizontal"
                size="tiny"
                label="X axis"
              >
                <Select
                  value={x_column}
                  onValueChange={(x_column) => onUpdateChartConfig({ x_column })}
                >
                  <SelectTrigger id="result-x-axis" size="tiny" className="w-full">
                    <SelectValue placeholder="Select a column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((x) => (
                      <SelectItem key={x} value={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItemLayout>

              <FormItemLayout
                id="result-y-axis"
                isReactForm={false}
                layout="horizontal"
                size="tiny"
                label="Y axis"
              >
                <MultiSelector
                  size="tiny"
                  values={y_series}
                  onValuesChange={(values) => {
                    if (values.length > MAX_CHART_Y_SERIES) return
                    onUpdateChartConfig({ y_series: values })
                  }}
                  className="w-full"
                >
                  <MultiSelectorTrigger
                    id="result-y-axis"
                    mode="inline-combobox"
                    label={`Select up to ${MAX_CHART_Y_SERIES} columns`}
                    deletableBadge
                    badgeLimit={1}
                    showIcon={false}
                    className="min-w-0"
                  />
                  <MultiSelectorContent>
                    <MultiSelectorList>
                      {columns.map((x) => (
                        <MultiSelectorItem
                          key={x}
                          value={x}
                          disabled={y_series.length >= MAX_CHART_Y_SERIES && !y_series.includes(x)}
                        >
                          {x}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormItemLayout>

              <FormItemLayout isReactForm={false} layout="horizontal" size="tiny" label="Scale">
                <ToggleGroup
                  value={scale}
                  onValueChange={(value) => {
                    if (value === 'linear' || (value === 'log' && canToggleLogScale)) {
                      onUpdateChartConfig({ scale: value })
                    }
                  }}
                  aria-label="Chart scale"
                  variant="default"
                  size="tiny"
                  type="single"
                  className="w-full"
                >
                  <ToggleGroupItem value="linear" className="w-full">
                    Linear
                  </ToggleGroupItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex w-full" tabIndex={!canToggleLogScale ? 0 : undefined}>
                        <ToggleGroupItem
                          value="log"
                          disabled={!canToggleLogScale}
                          className="w-full"
                        >
                          Log
                        </ToggleGroupItem>
                      </span>
                    </TooltipTrigger>
                    {!canToggleLogScale && (
                      <TooltipContent side="left">
                        {getLogScaleDisabledReason(y_series)}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </ToggleGroup>
              </FormItemLayout>

              <FormItemLayout
                id="cumulative"
                isReactForm={false}
                layout="horizontal"
                size="tiny"
                label="Cumulative"
              >
                <Switch
                  id="cumulative"
                  aria-label="Cumulative"
                  size="small"
                  checked={cumulative}
                  onCheckedChange={(cumulative) => onUpdateChartConfig({ cumulative })}
                />
              </FormItemLayout>

              <FormItemLayout
                id="show_labels"
                isReactForm={false}
                layout="horizontal"
                size="tiny"
                label="Show labels"
              >
                <Switch
                  id="show_labels"
                  aria-label="Show labels"
                  size="small"
                  checked={show_labels}
                  onCheckedChange={(show_labels) => onUpdateChartConfig({ show_labels })}
                />
              </FormItemLayout>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

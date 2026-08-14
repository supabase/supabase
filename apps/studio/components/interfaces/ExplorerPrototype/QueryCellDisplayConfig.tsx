/**
 * PROTOTYPE — display configuration popover.
 *
 * Same slot as today's `BlockViewConfiguration`, but it emits the spec's richer
 * shape: chart type, one x-axis field, and a **list** of series with optional
 * per-series labels.
 */

import { BarChart2, Plus, Settings2, Table as TableIcon, X } from 'lucide-react'
import {
  Button,
  Checkbox,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'

import { CHART_SERIES_COLORS } from './chartColors'
import type { ChartDisplay, QueryDisplay } from './ExplorerPrototype.types'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

const DEFAULT_CHART: ChartDisplay = {
  type: 'bar',
  x_axis: { field: '' },
  series: [],
}

interface QueryCellDisplayConfigProps {
  display: QueryDisplay
  columns: string[]
  onChange: (display: QueryDisplay) => void
}

export const QueryCellDisplayConfig = ({
  display,
  columns,
  onChange,
}: QueryCellDisplayConfigProps) => {
  const chart = display.type === 'chart' ? display.chart : DEFAULT_CHART
  const usedFields = chart.series.map((entry) => entry.field)
  const availableFields = columns.filter(
    (column) => column !== chart.x_axis.field && !usedFields.includes(column)
  )

  const updateChart = (next: Partial<ChartDisplay>) =>
    onChange({ type: 'chart', chart: { ...chart, ...next } })

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <ButtonTooltip
          variant="text"
          className="px-1"
          icon={<Settings2 size={14} strokeWidth={1.5} />}
          tooltip={{ content: { side: 'bottom', text: 'Display' } }}
        />
      </PopoverTrigger>

      <PopoverContent side="bottom" align="end" className="w-[280px] p-3">
        <div className="grid gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            value={display.type}
            className="w-full"
            onValueChange={(value: 'table' | 'chart') => {
              if (!value) return
              if (value === 'table') return onChange({ type: 'table' })
              onChange({
                type: 'chart',
                chart: {
                  ...chart,
                  x_axis: { field: chart.x_axis.field || columns[0] || '' },
                  series:
                    chart.series.length > 0
                      ? chart.series
                      : columns[1]
                        ? [{ field: columns[1] }]
                        : [],
                },
              })
            }}
          >
            <ToggleGroupItem className="w-full" value="table" aria-label="Show as table">
              <TableIcon className="h-4 w-4" />
              <p className="ml-2 text-xs">Table</p>
            </ToggleGroupItem>
            <ToggleGroupItem className="w-full" value="chart" aria-label="Show as chart">
              <BarChart2 className="h-4 w-4" />
              <p className="ml-2 text-xs">Chart</p>
            </ToggleGroupItem>
          </ToggleGroup>

          {display.type === 'chart' && (
            <>
              <ToggleGroup
                type="single"
                variant="outline"
                value={chart.type}
                className="w-full"
                onValueChange={(value: 'bar' | 'line') => value && updateChart({ type: value })}
              >
                <ToggleGroupItem className="w-full" value="bar" aria-label="Bar chart">
                  <p className="text-xs">Bar</p>
                </ToggleGroupItem>
                <ToggleGroupItem className="w-full" value="line" aria-label="Line chart">
                  <p className="text-xs">Line</p>
                </ToggleGroupItem>
              </ToggleGroup>

              <Select
                value={chart.x_axis.field}
                onValueChange={(field) => updateChart({ x_axis: { field } })}
              >
                <SelectTrigger className="text-left">
                  X axis {chart.x_axis.field && `— ${chart.x_axis.field}`}
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {columns.map((column) => (
                      <SelectItem value={column} key={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="grid gap-1">
                <p className="text-xs text-foreground-light">Series</p>
                {chart.series.map((entry, index) => (
                  <div key={entry.field} className="flex items-center gap-1">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        background: CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length],
                      }}
                    />
                    <span className="flex-1 truncate text-xs">{entry.label ?? entry.field}</span>
                    <Button
                      variant="text"
                      size="tiny"
                      icon={<X size={12} />}
                      aria-label={`Remove ${entry.field}`}
                      onClick={() =>
                        updateChart({
                          series: chart.series.filter((series) => series.field !== entry.field),
                        })
                      }
                    />
                  </div>
                ))}
                {chart.series.length === 0 && (
                  <p className="text-xs text-foreground-lighter">No series selected</p>
                )}

                {availableFields.length > 0 && (
                  <Select
                    value=""
                    onValueChange={(field) => updateChart({ series: [...chart.series, { field }] })}
                  >
                    <SelectTrigger className="text-left">
                      <span className="flex items-center gap-1.5 text-foreground-light">
                        <Plus size={12} /> Add series
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {availableFields.map((column) => (
                          <SelectItem value={column} key={column}>
                            {column}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid gap-2 *:flex *:items-center *:gap-2 *:p-1.5 *:pl-0 *:text-foreground-light">
                <Label htmlFor="cumulative">
                  <Checkbox
                    id="cumulative"
                    checked={chart.cumulative ?? false}
                    onClick={() => updateChart({ cumulative: !chart.cumulative })}
                  />
                  Cumulative
                </Label>
                <Label htmlFor="showLabels">
                  <Checkbox
                    id="showLabels"
                    checked={chart.show_labels ?? false}
                    onClick={() => updateChart({ show_labels: !chart.show_labels })}
                  />
                  Show labels
                </Label>
                <Label htmlFor="logScale">
                  <Checkbox
                    id="logScale"
                    checked={chart.log_scale ?? false}
                    onClick={() => updateChart({ log_scale: !chart.log_scale })}
                  />
                  Log scale
                </Label>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

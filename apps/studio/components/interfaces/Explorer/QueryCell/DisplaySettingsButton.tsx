import { BarChart2, Settings2, Table } from 'lucide-react'
import {
  Checkbox,
  Popover,
  PopoverContent,
  PopoverSeparator,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ExplorerToolbarAction } from '../ExplorerToolbar'
import { type QueryChartConfig, type QueryDisplay } from '../types'

interface DisplaySettingsButtonProps {
  display: QueryDisplay
  columns: string[]
  disabled: boolean
  onChange: (display: QueryDisplay) => void
}

// [Joshen] TODO support multiple y axis charts

export const DisplaySettingsButton = ({
  display,
  columns,
  disabled,
  onChange,
}: DisplaySettingsButtonProps) => {
  const { view, chart } = display
  const {
    type = 'bar',
    x_column,
    y_columns,
    cumulative = false,
    show_labels = false,
    scale = 'linear',
  } = chart ?? {}

  const onChangeView = (view: 'table' | 'chart') => {
    onChange({ ...display, view })
  }

  const onUpdateChartConfig = (payload: Partial<QueryChartConfig>) => {
    onChange({
      ...display,
      chart: {
        type: chart?.type ?? 'bar',
        x_column: chart?.x_column ?? '',
        y_columns: chart?.y_columns ?? [],
        cumulative: chart?.cumulative ?? false,
        scale: chart?.scale ?? 'linear',
        show_labels: chart?.show_labels ?? false,
        ...payload,
      },
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ExplorerToolbarAction disabled={disabled} icon={<Settings2 />} tooltip="Result settings" />
      </PopoverTrigger>
      <PopoverContent side="bottom" className="flex flex-col gap-y-3 p-0 py-3">
        <div className="flex flex-col gap-y-3 px-3">
          <p className="text-xs tracking-tighter uppercase font-mono text-foreground-lighter">
            Result display settings
          </p>

          <FormItemLayout isReactForm={false} label="View data as">
            <ToggleGroup
              value={view}
              onValueChange={(value) => {
                if (value === 'table' || value === 'chart') onChangeView(value)
              }}
              variant="outline"
              type="single"
            >
              <ToggleGroupItem value="table" className="w-full gap-x-2 data-[state=on]:bg-accent">
                <Table size={14} />
                <p>Table</p>
              </ToggleGroupItem>
              <ToggleGroupItem value="chart" className="w-full gap-x-2 data-[state=on]:bg-accent">
                <BarChart2 size={14} />
                <p>Chart</p>
              </ToggleGroupItem>
            </ToggleGroup>
          </FormItemLayout>
        </div>

        {view === 'chart' && (
          <>
            <PopoverSeparator />

            <FormItemLayout isReactForm={false} label="Render chart as" className="px-3 mb-1">
              <ToggleGroup
                value={type}
                onValueChange={(value) => {
                  if (value === 'bar' || value === 'line') onUpdateChartConfig({ type: value })
                }}
                variant="outline"
                type="single"
              >
                <ToggleGroupItem value="bar" className="w-full data-[state=on]:bg-accent">
                  Bar
                </ToggleGroupItem>
                <ToggleGroupItem value="line" className="w-full data-[state=on]:bg-accent">
                  Line
                </ToggleGroupItem>
              </ToggleGroup>
            </FormItemLayout>

            <div className="px-3 flex flex-col gap-y-2">
              <FormItemLayout isReactForm={false} layout="flex-row-reverse" label="X axis">
                <Select
                  value={x_column}
                  onValueChange={(x_column) => onUpdateChartConfig({ x_column })}
                >
                  <SelectTrigger className="w-32">
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

              <FormItemLayout isReactForm={false} layout="flex-row-reverse" label="Y Axis">
                <Select
                  value={y_columns?.[0]}
                  onValueChange={(y_column) => onUpdateChartConfig({ y_columns: [y_column] })}
                >
                  <SelectTrigger className="w-32">
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

              <FormItemLayout isReactForm={false} layout="flex-row-reverse" label="Scale">
                <Select
                  value={scale}
                  onValueChange={(scale) =>
                    onUpdateChartConfig({ scale: scale as 'log' | 'linear' })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select a column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="log">Logarithmic</SelectItem>
                  </SelectContent>
                </Select>
              </FormItemLayout>

              <FormItemLayout id="cumulative" isReactForm={false} layout="flex" label="Cumulative">
                <Checkbox
                  id="cumulative"
                  checked={cumulative}
                  onCheckedChange={(cumulative) =>
                    onUpdateChartConfig({ cumulative: Boolean(cumulative) })
                  }
                />
              </FormItemLayout>

              <FormItemLayout
                id="show_labels"
                isReactForm={false}
                layout="flex"
                label="Show labels"
              >
                <Checkbox
                  id="show_labels"
                  checked={show_labels}
                  onCheckedChange={(show_labels) =>
                    onUpdateChartConfig({ show_labels: Boolean(show_labels) })
                  }
                />
              </FormItemLayout>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

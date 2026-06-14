import { BarChart2, Settings2, Table } from 'lucide-react'
import {
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

import { ButtonTooltip } from '../ButtonTooltip'
import { ChartConfig } from '@/components/interfaces/SQLEditor/UtilityPanel/ChartConfig'

interface BlockViewConfigurationProps {
  columns: string[]
  view: 'chart' | 'table'
  isChart: boolean
  lockColumns?: boolean
  chartConfig?: ChartConfig
  changeView: (value: 'chart' | 'table') => void
  updateChartConfig: (config: ChartConfig) => void
}

export const BlockViewConfiguration = ({
  columns,
  view,
  isChart,
  lockColumns = false,
  chartConfig,
  changeView,
  updateChartConfig,
}: BlockViewConfigurationProps) => {
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <ButtonTooltip
          id="help-popover-button"
          type="text"
          className="px-1"
          icon={<Settings2 size={14} strokeWidth={1.5} />}
          tooltip={{ content: { side: 'bottom', text: 'View data' } }}
        />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="center" className="w-[240px] p-3">
        <form className="grid gap-2">
          <ToggleGroup
            type="single"
            value={view}
            className="w-full"
            onValueChange={(view: 'chart' | 'table') => {
              if (view) changeView(view)
            }}
          >
            <ToggleGroupItem className="w-full" value="table" aria-label="Show as table">
              <Table className="h-4 w-4" />
              <p className="text-xs ml-2">As table</p>
            </ToggleGroupItem>
            <ToggleGroupItem className="w-full" value="chart" aria-label="Show as chart">
              <BarChart2 className="h-4 w-4" />
              <p className="text-xs ml-2">As chart</p>
            </ToggleGroupItem>
          </ToggleGroup>

          {isChart && chartConfig && (
            <>
              <Select
                disabled={lockColumns}
                value={chartConfig?.xKey}
                onValueChange={(value) => updateChartConfig({ ...chartConfig, xKey: value })}
              >
                <SelectTrigger className="text-left">
                  X Axis {chartConfig?.xKey && `- ${chartConfig.xKey}`}
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {columns.map((key) => (
                      <SelectItem value={key} key={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                disabled={lockColumns}
                value={chartConfig?.yKey}
                onValueChange={(value) => updateChartConfig({ ...chartConfig, yKey: value })}
              >
                <SelectTrigger className="text-left">
                  Y Axis {chartConfig?.yKey && `- ${chartConfig.yKey}`}
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {columns.map((key) => (
                      <SelectItem value={key} key={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <div className="*:flex *:gap-2 *:items-center grid gap-2 *:text-foreground-light *:p-1.5 *:pl-0">
                <Label htmlFor="cumulative">
                  <Checkbox
                    id="cumulative"
                    checked={chartConfig?.cumulative}
                    onClick={() =>
                      updateChartConfig({
                        ...chartConfig,
                        cumulative: !chartConfig?.cumulative,
                      })
                    }
                  />
                  Cumulative
                </Label>
                <Label htmlFor="logScale">
                  <Checkbox
                    id="logScale"
                    checked={chartConfig?.logScale}
                    onClick={() =>
                      updateChartConfig({
                        ...chartConfig,
                        logScale: !chartConfig?.logScale,
                      })
                    }
                  />
                  Log scale
                </Label>
              </div>
            </>
          )}
        </form>
      </PopoverContent>
    </Popover>
  )
}

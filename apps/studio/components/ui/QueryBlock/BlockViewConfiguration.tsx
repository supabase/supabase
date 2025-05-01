import { BarChart2, Settings2, Table, Type } from 'lucide-react'

import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import {
  Checkbox_Shadcn_,
  Label_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  ToggleGroup,
  ToggleGroupItem,
} from 'ui'
import { ButtonTooltip } from '../ButtonTooltip'

interface BlockViewConfigurationProps {
  columns: string[]
  view: 'chart' | 'table' | 'number'
  isChart: boolean
  lockColumns?: boolean
  chartConfig?: ChartConfig
  changeView: (value: 'chart' | 'table' | 'number') => void
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
    <Popover_Shadcn_ modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <ButtonTooltip
          id="help-popover-button"
          type="text"
          className="px-1"
          icon={<Settings2 size={14} />}
          tooltip={{ content: { side: 'bottom', text: 'View data' } }}
        />
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ side="bottom" align="center" className="w-[240px] p-3">
        <form className="grid gap-2">
          <ToggleGroup
            type="single"
            value={view}
            className="w-full"
            onValueChange={(view: 'chart' | 'table' | 'number') => {
              if (view) changeView(view)
            }}
          >
            <ToggleGroupItem className="w-full" value="table" aria-label="Show as table">
              <Table className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem className="w-full" value="chart" aria-label="Show as chart">
              <BarChart2 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem className="w-full" value="number" aria-label="Show as number">
              <Type className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {view === 'chart' && isChart && chartConfig && (
            <>
              <Select_Shadcn_
                disabled={lockColumns}
                value={chartConfig?.xKey}
                onValueChange={(value) => updateChartConfig({ ...chartConfig, xKey: value })}
              >
                <SelectTrigger_Shadcn_ className="text-left">
                  X Axis {chartConfig?.xKey && `- ${chartConfig.xKey}`}
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectGroup_Shadcn_>
                    {columns.map((key) => (
                      <SelectItem_Shadcn_ value={key} key={key}>
                        {key}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectGroup_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>

              <Select_Shadcn_
                disabled={lockColumns}
                value={chartConfig?.yKey}
                onValueChange={(value) => updateChartConfig({ ...chartConfig, yKey: value })}
              >
                <SelectTrigger_Shadcn_ className="text-left">
                  Y Axis {chartConfig?.yKey && `- ${chartConfig.yKey}`}
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectGroup_Shadcn_>
                    {columns.map((key) => (
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
                      updateChartConfig({
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

          {view === 'number' && chartConfig && (
            <>
              <Select_Shadcn_
                value={chartConfig?.primaryKey ?? ''}
                onValueChange={(value) =>
                  updateChartConfig({ ...chartConfig, primaryKey: value || undefined })
                }
              >
                <SelectTrigger_Shadcn_ className="text-left">
                  Primary Value {chartConfig?.primaryKey && `- ${chartConfig.primaryKey}`}
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectGroup_Shadcn_>
                    {columns.map((key) => (
                      <SelectItem_Shadcn_ value={key} key={key}>
                        {key}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectGroup_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>

              <Select_Shadcn_
                value={chartConfig?.secondaryKey ?? ''}
                onValueChange={(value) => {
                  const newSecondaryKey = value === '__none__' ? undefined : value
                  updateChartConfig({ ...chartConfig, secondaryKey: newSecondaryKey })
                }}
              >
                <SelectTrigger_Shadcn_ className="text-left">
                  Secondary Value{' '}
                  {chartConfig?.secondaryKey ? `- ${chartConfig.secondaryKey}` : '(Optional)'}
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectGroup_Shadcn_>
                    <SelectItem_Shadcn_ value="__none__" key="none">
                      None
                    </SelectItem_Shadcn_>
                    {columns.map((key) => (
                      <SelectItem_Shadcn_ value={key} key={key}>
                        {key}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectGroup_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </>
          )}
        </form>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}

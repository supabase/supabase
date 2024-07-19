import { Checkbox } from '@ui/components/shadcn/ui/checkbox'
import BarChart from 'components/ui/Charts/BarChart'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import dayjs from 'dayjs'
import { ArrowUpDown } from 'lucide-react'
import { useMemo } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  Label_Shadcn_,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
} from 'ui'

type Results = { rows: readonly any[] }

export type ChartConfig = {
  type: 'bar'
  cumulative: boolean
  xKey: string
  yKey: string
  showLabels?: boolean
  showGrid?: boolean
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
export function ChartConfig({ results = { rows: [] }, config, onConfigChange }: ChartConfigProps) {
  // If a result key is not valid, it will be filtered out
  const resultKeys = useMemo(() => {
    return Object.keys(results.rows[0] || {}).filter((key) => {
      const type = typeof results.rows[0][key]
      return VALID_RESULT_KEY_TYPES.includes(type)
    })
  }, [results])

  // Compute cumulative results only if necessary
  const cumulativeResults = useMemo(() => getCumulativeResults(results, config), [results, config])

  const resultToRender = config.cumulative ? cumulativeResults : results.rows

  if (!resultKeys.length) {
    return (
      <div className="p-2">
        <NoDataPlaceholder
          size="normal"
          description="Execute a query and configure the chart options."
        />
      </div>
    )
  }

  const getDateFormat = (key: any) => {
    const value = resultToRender[0][key]
    if (typeof value === 'number') return 'number'
    if (dayjs(value).isValid()) return 'date'
    return 'string'
  }

  const xKeyDateFormat = getDateFormat(config.xKey)

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-grow h-full">
      <>
        <ResizablePanel className="p-4 h-full" defaultSize={75}>
          {config.type === 'bar' && (
            <BarChart
              showLegend
              size="normal"
              xAxisIsDate={xKeyDateFormat === 'date'}
              data={resultToRender as any}
              xAxisKey={config.xKey}
              yAxisKey={config.yKey}
              emptyStateMessage="Execute a query and configure the chart options"
              showGrid={config.showGrid}
              XAxisProps={{
                angle: 0,
                interval: 0,
                hide: !config.showLabels,
                tickFormatter: (idx: string) => {
                  const value = resultToRender[+idx][config.xKey]
                  if (xKeyDateFormat === 'date') {
                    return dayjs(value).format('MMM D YYYY')
                  }
                  return value
                },
              }}
              YAxisProps={{
                tickFormatter: (value: number) => value.toLocaleString(),
                label: <></>,
                hide: !config.showLabels,
              }}
            />
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={15} className="px-3 py-3 space-y-4">
          <form className="grid gap-4">
            <div className="flex justify-between items-center h-5">
              <h2 className="text-sm text-foreground-lighter">Chart options</h2>
              {config.xKey && config.yKey && (
                <Button
                  type="text"
                  onClick={() => {
                    const currentX = config.xKey
                    const currentY = config.yKey
                    onConfigChange({ ...config, xKey: currentY, yKey: currentX })
                  }}
                  title="Swap X and Y axis"
                  icon={<ArrowUpDown size="15" className="text-foreground-lighter" />}
                >
                  Flip
                </Button>
              )}
            </div>

            <Select_Shadcn_
              value={config.xKey}
              onValueChange={(value) => {
                onConfigChange({ ...config, xKey: value })
              }}
            >
              <SelectTrigger_Shadcn_>
                X Axis {config.xKey && `- ${config.xKey}`}
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectGroup_Shadcn_>
                  {resultKeys.map((key) => (
                    <SelectItem_Shadcn_ value={key} key={key}>
                      {key}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectGroup_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
            <Select_Shadcn_
              value={config.yKey}
              onValueChange={(value) => {
                onConfigChange({ ...config, yKey: value })
              }}
            >
              <SelectTrigger_Shadcn_>
                Y Axis {config.yKey && `- ${config.yKey}`}
              </SelectTrigger_Shadcn_>
              <SelectContent_Shadcn_>
                <SelectGroup_Shadcn_>
                  {resultKeys.map((key) => (
                    <SelectItem_Shadcn_ value={key} key={key}>
                      {key}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectGroup_Shadcn_>
              </SelectContent_Shadcn_>
            </Select_Shadcn_>
            <div className="*:flex *:gap-2 *:items-center grid gap-2 *:text-foreground-light *:p-1.5 *:pl-0">
              <Label_Shadcn_ className="" htmlFor="cumulative">
                <Checkbox_Shadcn_
                  id="cumulative"
                  name="cumulative"
                  checked={config.cumulative}
                  onClick={() => onConfigChange({ ...config, cumulative: !config.cumulative })}
                />
                Cumulative
              </Label_Shadcn_>

              <Label_Shadcn_ htmlFor="showLabels">
                <Checkbox_Shadcn_
                  id="showLabels"
                  name="showLabels"
                  checked={config.showLabels}
                  onClick={() => onConfigChange({ ...config, showLabels: !config.showLabels })}
                />
                Show labels
              </Label_Shadcn_>

              <Label_Shadcn_ htmlFor="showGrid">
                <Checkbox_Shadcn_
                  id="showGrid"
                  name="showGrid"
                  checked={config.showGrid}
                  onClick={() => onConfigChange({ ...config, showGrid: !config.showGrid })}
                />
                Show grid
              </Label_Shadcn_>
            </div>
          </form>
        </ResizablePanel>
      </>
    </ResizablePanelGroup>
  )
}

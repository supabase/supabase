import BarChart from 'components/ui/Charts/BarChart'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import { ArrowUpDown } from 'lucide-react'
import { useMemo } from 'react'
import {
  Button,
  Checkbox,
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
  type: 'bar' | 'line'
  cumulative: boolean
  xKey: string
  yKey: string
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

type ChartConfigProps = {
  results: Results
  config: ChartConfig
  onConfigChange: (config: ChartConfig) => void
}
export function ChartConfig({ results = { rows: [] }, config, onConfigChange }: ChartConfigProps) {
  const resultKeys = useMemo(
    () => (results?.rows?.length ? Object.keys(results.rows[0]) : []),
    [results]
  )

  // Compute cumulative results only if necessary
  const cumulativeResults = useMemo(() => getCumulativeResults(results, config), [results, config])

  const resultToRender = config.cumulative ? cumulativeResults : results.rows

  if (!resultKeys.length) {
    return (
      <div className="p-2">
        <NoDataPlaceholder
          size="normal"
          message="
          Execute a query and configure the chart options.
        "
        />
      </div>
    )
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-grow h-full">
      <>
        <ResizablePanel className="p-4" defaultSize={85}>
          <div className="h-full">
            {config.type === 'bar' && (
              <BarChart
                size="normal"
                data={resultToRender as any}
                xAxisKey={config.xKey}
                yAxisKey={config.yKey}
                emptyStateMessage="Execute a query and configure the chart options"
              />
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={15} minSize={15} className="px-3 py-3 space-y-4">
          <>
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

            <Checkbox
              checked={config.cumulative}
              label="Cumulative"
              onChange={(e) => {
                onConfigChange({ ...config, cumulative: e.target.checked })
              }}
            />
          </>
        </ResizablePanel>
      </>
    </ResizablePanelGroup>
  )
}

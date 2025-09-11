import { Filter } from 'lucide-react'

import type { MetricsVisibility, HeatmapMode } from './contexts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/shadcn/ui/select'
import {
  Button,
  Checkbox_Shadcn_,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'

type Props = {
  metricsVisibility: MetricsVisibility
  setMetricsVisibility: (updater: (prev: MetricsVisibility) => MetricsVisibility) => void
  heatmapMode: HeatmapMode
  setHeatmapMode: (mode: HeatmapMode) => void
  showMiniMap?: boolean
  setShowMiniMap?: (show: boolean) => void
  variant?: 'overlay' | 'toolbar'
  className?: string
}

export const ControlsOverlay = ({
  metricsVisibility,
  setMetricsVisibility,
  heatmapMode,
  setHeatmapMode,
  showMiniMap,
  setShowMiniMap,
  variant = 'overlay',
  className,
}: Props) => {
  return (
    <div
      className={cn(
        variant === 'overlay'
          ? 'absolute z-10 top-2 right-2 p-2 bg-foreground-muted/20 backdrop-blur-sm border'
          : 'p-2 bg-foreground-muted/20 border',
        'text-xs',
        className
      )}
    >
      <div className="flex flex-wrap gap-2 items-center">
        <div className="font-medium">Display:</div>
        <Label_Shadcn_ className="inline-flex items-center gap-1 text-xs">
          <Checkbox_Shadcn_
            checked={metricsVisibility.time}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, time: Boolean(checked) }))
            }
          />
          <span>Time</span>
        </Label_Shadcn_>
        <Label_Shadcn_ className="inline-flex items-center gap-1 text-xs">
          <Checkbox_Shadcn_
            checked={metricsVisibility.rows}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, rows: Boolean(checked) }))
            }
          />
          <span>Rows</span>
        </Label_Shadcn_>
        <Label_Shadcn_ className="inline-flex items-center gap-1 text-xs">
          <Checkbox_Shadcn_
            checked={metricsVisibility.cost}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, cost: Boolean(checked) }))
            }
          />
          <span>Cost</span>
        </Label_Shadcn_>
        <Label_Shadcn_ className="inline-flex items-center gap-1 text-xs">
          <Checkbox_Shadcn_
            checked={metricsVisibility.buffers}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, buffers: Boolean(checked) }))
            }
          />
          <span>Buffers</span>
        </Label_Shadcn_>
        <Label_Shadcn_ className="inline-flex items-center gap-1 text-xs">
          <Checkbox_Shadcn_
            checked={metricsVisibility.output}
            onCheckedChange={(checked) =>
              setMetricsVisibility((v) => ({ ...v, output: Boolean(checked) }))
            }
          />
          <span>Output</span>
        </Label_Shadcn_>

        <Popover_Shadcn_>
          <PopoverTrigger_Shadcn_ asChild>
            <Button
              size="tiny"
              type={
                Object.values(metricsVisibility).filter(Boolean).length !==
                Object.keys(metricsVisibility).length
                  ? 'default'
                  : 'dashed'
              }
              className="px-1"
              icon={<Filter />}
            />
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0 w-56" side="bottom" align="center" portal={true}>
            <div className="px-3 pt-3 pb-2 flex flex-col gap-y-2">
              <p className="text-xs">Show items</p>
              <div className="flex flex-col">
                {/* here start */}
                <div className="group flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-x-2">
                    <Checkbox_Shadcn_
                      id="time"
                      name="time"
                      checked={metricsVisibility.time}
                      onCheckedChange={(checked) =>
                        setMetricsVisibility((v) => ({ ...v, time: Boolean(checked) }))
                      }
                    />
                    <Label_Shadcn_ htmlFor="time" className="capitalize text-xs">
                      Time
                    </Label_Shadcn_>
                  </div>
                </div>

                <div className="group flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-x-2">
                    <Checkbox_Shadcn_
                      id="rows"
                      name="rows"
                      checked={metricsVisibility.rows}
                      onCheckedChange={(checked) =>
                        setMetricsVisibility((v) => ({ ...v, rows: Boolean(checked) }))
                      }
                    />
                    <Label_Shadcn_ htmlFor="rows" className="capitalize text-xs">
                      Rows
                    </Label_Shadcn_>
                  </div>
                </div>

                <div className="group flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-x-2">
                    <Checkbox_Shadcn_
                      id="cost"
                      name="cost"
                      checked={metricsVisibility.cost}
                      onCheckedChange={(checked) =>
                        setMetricsVisibility((v) => ({ ...v, cost: Boolean(checked) }))
                      }
                    />
                    <Label_Shadcn_ htmlFor="cost" className="capitalize text-xs">
                      Cost
                    </Label_Shadcn_>
                  </div>
                </div>

                <div className="group flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-x-2">
                    <Checkbox_Shadcn_
                      id="buffers"
                      name="buffers"
                      checked={metricsVisibility.buffers}
                      onCheckedChange={(checked) =>
                        setMetricsVisibility((v) => ({ ...v, buffers: Boolean(checked) }))
                      }
                    />
                    <Label_Shadcn_ htmlFor="buffers" className="capitalize text-xs">
                      Buffers
                    </Label_Shadcn_>
                  </div>
                </div>

                <div className="group flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-x-2">
                    <Checkbox_Shadcn_
                      id="output"
                      name="output"
                      checked={metricsVisibility.output}
                      onCheckedChange={(checked) =>
                        setMetricsVisibility((v) => ({ ...v, output: Boolean(checked) }))
                      }
                    />
                    <Label_Shadcn_ htmlFor="output" className="capitalize text-xs">
                      Output
                    </Label_Shadcn_>
                  </div>
                </div>
                {/* here end */}
              </div>
            </div>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>

        <div className="h-[14px] w-px bg-border mx-1" />
        <div className="flex items-center gap-x-1 text-xs">
          <span>Heatmap:</span>
          <Select value={heatmapMode} onValueChange={(v) => setHeatmapMode(v as HeatmapMode)}>
            <SelectTrigger size="tiny" className="w-20">
              <SelectValue placeholder="none" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="none">none</SelectItem>
              <SelectItem value="time">time</SelectItem>
              <SelectItem value="rows">rows</SelectItem>
              <SelectItem value="cost">cost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-[14px] w-px bg-border mx-1" />
        <Label_Shadcn_ className="inline-flex items-center gap-1 text-xs">
          <Checkbox_Shadcn_
            checked={!!showMiniMap}
            onCheckedChange={(checked) => setShowMiniMap?.(Boolean(checked))}
          />
          <span>Mini map</span>
        </Label_Shadcn_>
      </div>
    </div>
  )
}

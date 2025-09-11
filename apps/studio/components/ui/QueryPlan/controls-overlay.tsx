import { useState } from 'react'
import { Filter, ChevronsUpDown, Check } from 'lucide-react'

import type { MetricsVisibility, HeatmapMode } from './contexts'
import {
  cn,
  Button,
  Checkbox_Shadcn_,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  Switch,
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
  const [heatmapPopoverOpen, setHeatmapPopoverOpen] = useState(false)

  return (
    <div
      className={cn(
        variant === 'overlay'
          ? 'absolute z-10 top-2 right-2 p-2 bg-foreground-muted/20 backdrop-blur-sm border'
          : 'p-2',
        'text-xs',
        className
      )}
    >
      <div className="flex flex-wrap gap-2 items-center">
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
              </div>
            </div>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>

        <div className="flex items-center gap-x-1 text-xs">
          <Popover_Shadcn_
            open={heatmapPopoverOpen}
            onOpenChange={setHeatmapPopoverOpen}
            modal={false}
          >
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                size="tiny"
                type="default"
                data-testid="schema-selector"
                className={`w-full [&>span]:w-full !pr-1 space-x-1`}
                iconRight={
                  <ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />
                }
              >
                {heatmapMode !== 'none' ? (
                  <div className="w-full flex gap-1">
                    <p className="text-foreground-lighter">heatmap</p>
                    <p className="text-foreground">{heatmapMode}</p>
                  </div>
                ) : (
                  <div className="w-full flex gap-1">
                    <p className="text-foreground-lighter">Choose a heatmap…</p>
                  </div>
                )}
              </Button>
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_
              className="p-0 min-w-[200px] pointer-events-auto"
              side="bottom"
              align="start"
              portal
              sameWidthAsTrigger
            >
              <Command_Shadcn_>
                <CommandInput_Shadcn_ placeholder="Find schema..." />
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No schemas found</CommandEmpty_Shadcn_>
                  <CommandGroup_Shadcn_>
                    {['time', 'rows', 'cost', 'none']?.map((heatmapItem) => (
                      <CommandItem_Shadcn_
                        key={heatmapItem}
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          setHeatmapMode(heatmapItem as HeatmapMode)
                          setHeatmapPopoverOpen(false)
                        }}
                        onClick={() => {
                          setHeatmapMode(heatmapItem as HeatmapMode)
                          setHeatmapPopoverOpen(false)
                        }}
                      >
                        <span>{heatmapItem}</span>
                        {heatmapMode === heatmapItem && (
                          <Check className="text-brand" strokeWidth={2} size={16} />
                        )}
                      </CommandItem_Shadcn_>
                    ))}
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </div>
        <div className="flex items-center gap-x-1">
          <Switch
            id="mini-map"
            checked={!!showMiniMap}
            onCheckedChange={(checked) => setShowMiniMap?.(Boolean(checked))}
          />
          <Label_Shadcn_ htmlFor="mini-map" className="text-xs">
            Mini map
          </Label_Shadcn_>
        </div>
      </div>
    </div>
  )
}

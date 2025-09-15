import { type SetStateAction, useState } from 'react'
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
} from 'ui'

type Props = {
  metricsVisibility: MetricsVisibility
  setMetricsVisibility: (value: SetStateAction<MetricsVisibility>) => void
  heatmapMode: HeatmapMode
  setHeatmapMode: (mode: HeatmapMode) => void
  variant?: 'overlay' | 'toolbar'
  className?: string
  portal?: boolean
}

const DISPLAY_ITEMS: { label: string; value: keyof MetricsVisibility }[] = [
  { label: 'Time', value: 'time' },
  { label: 'Rows', value: 'rows' },
  { label: 'Cost', value: 'cost' },
  { label: 'Buffers', value: 'buffers' },
  { label: 'Output', value: 'output' },
]

export const ControlsOverlay = ({
  metricsVisibility,
  setMetricsVisibility,
  heatmapMode,
  setHeatmapMode,
  variant = 'overlay',
  className,
  portal = true,
}: Props) => {
  const [heatmapPopoverOpen, setHeatmapPopoverOpen] = useState(false)

  return (
    <div
      className={cn(
        'text-xs',
        variant === 'overlay'
          ? 'px-2 py-1 bg-foreground-muted/20 backdrop-blur-sm border rounded-md'
          : null,
        className
      )}
    >
      <div className="flex flex-wrap gap-2 items-center">
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
              portal={portal}
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
          <PopoverContent_Shadcn_ className="p-0 w-56" side="bottom" align="center" portal={portal}>
            <div className="px-3 pt-3 pb-2 flex flex-col gap-y-2">
              <p className="text-xs">Show items</p>
              <ul className="flex flex-col">
                {SHOW_ITEMS.map((item) => (
                  <li className="group flex items-center justify-between py-0.5" key={item.value}>
                    <div className="flex items-center gap-x-2">
                      <Checkbox_Shadcn_
                        id={item.value}
                        name={item.value}
                        checked={metricsVisibility[item.value]}
                        onCheckedChange={(checked) =>
                          setMetricsVisibility((v) => ({ ...v, [item.value]: Boolean(checked) }))
                        }
                      />
                      <Label_Shadcn_ htmlFor={item.value} className="capitalize text-xs">
                        {item.label}
                      </Label_Shadcn_>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      </div>
    </div>
  )
}

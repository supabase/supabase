import { Settings } from 'lucide-react'
import { useState } from 'react'
import { Label, Popover, PopoverContent, PopoverTrigger, Switch } from 'ui'

import { useChartHoverState } from './useChartHoverState'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

interface ReportSettingsProps {
  chartId: string
}

export const ReportSettings = ({ chartId }: ReportSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { syncHover, syncTooltip, setSyncHover, setSyncTooltip } = useChartHoverState(chartId)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ButtonTooltip
          variant="default"
          icon={<Settings />}
          className="w-7"
          tooltip={{ content: { side: 'bottom', text: 'Report settings' } }}
        />
      </PopoverTrigger>
      <PopoverContent align="center" side="bottom" className="w-64 p-3 flex flex-col gap-y-4">
        <div className="flex items-start justify-between space-x-2">
          <Label htmlFor="sync-hover" className="text-xs">
            <p>Sync chart headers</p>
            <p className="text-xs text-foreground-light mt-1 text-balance">
              Hovering over any chart will update headers across all charts
            </p>
          </Label>
          <Switch id="sync-hover" checked={syncHover} onCheckedChange={setSyncHover} />
        </div>

        {syncHover && (
          <div className="flex items-start justify-between space-x-2">
            <Label htmlFor="sync-tooltips" className="text-xs">
              <p>Sync tooltips</p>
              <p className="text-xs text-foreground-light mt-1 text-balance">
                Shows tooltips on all charts
              </p>
            </Label>
            <Switch
              id="sync-tooltips"
              checked={syncTooltip}
              disabled={!syncHover}
              onCheckedChange={setSyncTooltip}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Settings } from 'lucide-react'
import { useState } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Label_Shadcn_,
  Switch,
} from 'ui'
import { useChartHoverState } from './useChartHoverState'

interface ReportSettingsProps {
  chartId: string
}

export const ReportSettings = ({ chartId }: ReportSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { syncHover, syncTooltip, setSyncHover, setSyncTooltip } = useChartHoverState(chartId)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <ButtonTooltip
          type="default"
          icon={<Settings />}
          className="w-7"
          tooltip={{ content: { side: 'bottom', text: 'Report settings' } }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-64 p-3">
        <div className="space-y-4">
          <Label_Shadcn_ htmlFor="sync-hover" className="text-sm font-normal">
            <div className="flex items-center justify-between space-x-2">
              Sync chart headers
              <Switch id="sync-hover" checked={syncHover} onCheckedChange={setSyncHover} />
            </div>
            <p className="text-xs text-foreground-light mt-1">
              When enabled, hovering over any chart will update headers across all charts
            </p>
          </Label_Shadcn_>

          <Label_Shadcn_ htmlFor="sync-tooltips" className="text-sm font-normal flex flex-col">
            <div className="flex items-center justify-between space-x-2">
              Sync tooltips
              <Switch
                id="sync-tooltips"
                checked={syncTooltip}
                disabled={!syncHover}
                onCheckedChange={setSyncTooltip}
              />
            </div>
            <p className="text-xs text-foreground-light mt-1">
              When enabled, also shows tooltips on all charts.{' '}
              <span className={cn(syncHover ? 'text-foreground-light' : 'text-foreground')}>
                Requires header sync.
              </span>
            </p>
          </Label_Shadcn_>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

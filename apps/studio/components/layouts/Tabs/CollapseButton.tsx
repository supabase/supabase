import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { useAppStateSnapshot } from 'state/app-state'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export function CollapseButton({ hideTabs }: { hideTabs: boolean }) {
  const { showSidebar, setShowSidebar } = useAppStateSnapshot()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center w-10 h-10 hover:bg-surface-100 shrink-0',
            !hideTabs && 'border-b border-b-default'
          )}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? (
            <PanelLeftClose
              size={16}
              strokeWidth={1.5}
              className="text-foreground-lighter hover:text-foreground-light"
            />
          ) : (
            <PanelLeftOpen
              size={16}
              strokeWidth={1.5}
              className="text-foreground-lighter hover:text-foreground-light"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{true ? 'Collapse' : 'Expand'} sidebar</TooltipContent>
    </Tooltip>
  )
}

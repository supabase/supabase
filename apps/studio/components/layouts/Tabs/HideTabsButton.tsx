import { Eye, EyeOff } from 'lucide-react'

import { useAppStateSnapshot } from 'state/app-state'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export function HideTabsButton({ hideTabs }: { hideTabs: boolean }) {
  const { showTabs, setShowTabs } = useAppStateSnapshot()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex items-center justify-end w-10 h-10 hover:bg-surface-100 shrink-0"
          onClick={() => setShowTabs(!showTabs)}
        >
          {showTabs ? (
            <EyeOff
              size={16}
              strokeWidth={1.5}
              className="text-foreground-lighter hover:text-foreground-light"
            />
          ) : (
            <Eye
              size={16}
              strokeWidth={1.5}
              className="text-foreground-lighter hover:text-foreground-light"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{hideTabs ? 'Hide' : 'Show'} tabs</TooltipContent>
    </Tooltip>
  )
}

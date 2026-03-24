import { useBreakpoint } from 'common'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export function CollapseButton({ hideTabs }: { hideTabs: boolean }) {
  const { showSidebar, setShowSidebar, mobileMenuOpen, setMobileMenuOpen } = useAppStateSnapshot()
  const isMobile = useBreakpoint('md')

  const handleToggle = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen)
    } else {
      setShowSidebar(!showSidebar)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'hidden md:flex items-center justify-center w-10 h-[var(--header-height)] hover:bg-surface-100 shrink-0',
            !hideTabs && 'border-b border-b-default'
          )}
          onClick={handleToggle}
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
      <TooltipContent side="bottom">{showSidebar ? 'Collapse' : 'Expand'} sidebar</TooltipContent>
    </Tooltip>
  )
}

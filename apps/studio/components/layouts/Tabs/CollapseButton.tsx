import { useBreakpoint } from 'common'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useAppStateSnapshot } from '@/state/app-state'

export function CollapseButton({
  hideTabs,
  hideBottomBorder = false,
  heightClassName,
}: {
  hideTabs: boolean
  hideBottomBorder?: boolean
  heightClassName?: string
}) {
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
            'hidden md:flex shrink-0 items-center justify-center w-10 hover:bg-surface-100',
            heightClassName ?? 'h-(--header-height)',
            !hideTabs && !hideBottomBorder && 'border-b border-b-default'
          )}
          onClick={handleToggle}
        >
          {showSidebar ? (
            <>
              <PanelLeftClose
                size={16}
                strokeWidth={1.5}
                className="text-foreground-lighter hover:text-foreground-light"
              />
              <span className="sr-only">Collapse sidebar</span>
            </>
          ) : (
            <>
              <PanelLeftOpen
                size={16}
                strokeWidth={1.5}
                className="text-foreground-lighter hover:text-foreground-light"
              />
              <span className="sr-only">Expand sidebar</span>
            </>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{showSidebar ? 'Collapse' : 'Expand'} sidebar</TooltipContent>
    </Tooltip>
  )
}

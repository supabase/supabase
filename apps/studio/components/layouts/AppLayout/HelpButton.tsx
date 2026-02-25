import { useBreakpoint } from 'common'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { HelpCircle } from 'lucide-react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn } from 'ui'

const HelpButton = () => {
  const { toggleSidebar, activeSidebar } = useSidebarManagerSnapshot()
  const isMobile = useBreakpoint('md')

  const isOpen = activeSidebar?.id === SIDEBAR_KEYS.HELP_PANEL
  const handleClick = () => {
    if (isMobile && isOpen) return
    toggleSidebar(SIDEBAR_KEYS.HELP_PANEL)
  }

  return (
    <ButtonTooltip
      type={isOpen ? 'secondary' : 'outline'}
      size="tiny"
      id="search-trigger"
      className={cn(
        'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group text-foreground-light',
        isOpen && 'text-background'
      )}
      onClick={handleClick}
      tooltip={{
        content: {
          text: 'Help & Support',
        },
      }}
    >
      <HelpCircle size={16} strokeWidth={1.5} />
    </ButtonTooltip>
  )
}

export default HelpButton

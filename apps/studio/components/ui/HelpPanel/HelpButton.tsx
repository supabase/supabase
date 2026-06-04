import { HelpCircle } from 'lucide-react'
import { cn } from 'ui'

import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useTrack } from '@/lib/telemetry/track'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const HelpButton = () => {
  const { toggleSidebar, activeSidebar } = useSidebarManagerSnapshot()
  const track = useTrack()

  const isOpen = activeSidebar?.id === SIDEBAR_KEYS.HELP_PANEL

  return (
    <ButtonTooltip
      id="help-dropdown-button"
      type={isOpen ? 'secondary' : 'outline'}
      size="tiny"
      className={cn('rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group')}
      onClick={() => {
        toggleSidebar(SIDEBAR_KEYS.HELP_PANEL)
        if (!isOpen) {
          track('help_button_clicked')
        }
      }}
      tooltip={{ content: { text: 'Help' } }}
    >
      <HelpCircle
        size={16}
        strokeWidth={1.5}
        className={cn(
          'text-foreground-light group-hover:text-foreground',
          isOpen && 'text-background group-hover:text-background'
        )}
      />
      <span className="sr-only">Help</span>
    </ButtonTooltip>
  )
}

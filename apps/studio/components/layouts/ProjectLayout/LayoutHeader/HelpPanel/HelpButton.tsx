import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { HelpCircle } from 'lucide-react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn } from 'ui'

export const HelpButton = () => {
  const { toggleSidebar, activeSidebar } = useSidebarManagerSnapshot()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  const isOpen = activeSidebar?.id === SIDEBAR_KEYS.HELP_PANEL

  return (
    <ButtonTooltip
      id="help-dropdown-button"
      type={isOpen ? 'secondary' : 'outline'}
      size="tiny"
      className={cn('rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group')}
      onClick={() => {
        toggleSidebar(SIDEBAR_KEYS.HELP_PANEL)
        // Don't send telemetry event if dropdown is already open
        if (!isOpen) {
          sendEvent({
            action: 'help_button_clicked',
            groups: { project: project?.ref, organization: org?.slug },
          })
        }
      }}
      tooltip={{ content: { side: 'bottom', text: 'Help' } }}
    >
      <HelpCircle
        size={16}
        strokeWidth={1.5}
        className={cn(
          'text-foreground-light group-hover:text-foreground',
          isOpen && 'text-background group-hover:text-background'
        )}
      />
    </ButtonTooltip>
  )
}

import { ShieldAlert } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAdvisorCenterStateSnapshot } from 'state/advisor-center-state'
import { SIDEBAR_KEYS, sidebarManagerState, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn } from 'ui'

export const AdvisorButton = () => {
  const advisorSnap = useAdvisorCenterStateSnapshot()
  const sidebarSnap = useSidebarManagerSnapshot()

  const handleClick = () => {
    if (advisorSnap.open) {
      sidebarManagerState.closeSidebar(SIDEBAR_KEYS.ADVISOR_CENTER)
    } else {
      sidebarManagerState.openSidebar(SIDEBAR_KEYS.ADVISOR_CENTER)
    }
  }

  const isOpen = sidebarSnap.panels[SIDEBAR_KEYS.ADVISOR_CENTER]?.open

  return (
    <ButtonTooltip
      type="outline"
      size="tiny"
      id="advisor-center-trigger"
      className={cn(
        "rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group",
        isOpen && "bg-foreground text-background"
      )}
      onClick={handleClick}
      tooltip={{
        content: {
          text: 'Advisor Center',
        },
      }}
    >
      <ShieldAlert
        size={16}
        strokeWidth={1.5}
        className={cn(
          "text-foreground-light group-hover:text-foreground",
          isOpen && "text-background group-hover:text-background"
        )}
      />
    </ButtonTooltip>
  )
}

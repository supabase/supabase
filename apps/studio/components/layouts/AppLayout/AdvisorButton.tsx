import { ShieldAlert } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAdvisorCenterStateSnapshot } from 'state/advisor-center-state'
import { SIDEBAR_KEYS, sidebarManagerState } from 'state/sidebar-manager-state'

export const AdvisorButton = () => {
  const advisorSnap = useAdvisorCenterStateSnapshot()

  const handleClick = () => {
    if (advisorSnap.open) {
      sidebarManagerState.closeSidebar(SIDEBAR_KEYS.ADVISOR_CENTER)
    } else {
      sidebarManagerState.openSidebar(SIDEBAR_KEYS.ADVISOR_CENTER)
    }
  }

  return (
    <ButtonTooltip
      type="text"
      size="tiny"
      id="advisor-center-trigger"
      className="rounded-none w-[32px] h-[30px] flex items-center justify-center p-0 hover:bg-surface-300"
      onClick={handleClick}
      tooltip={{
        content: {
          text: 'Advisor Center',
        },
      }}
    >
      <ShieldAlert size={16} strokeWidth={1.5} />
    </ButtonTooltip>
  )
}

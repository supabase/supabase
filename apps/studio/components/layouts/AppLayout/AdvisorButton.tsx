import { ShieldAlert } from 'lucide-react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import {
  SIDEBAR_KEYS,
  sidebarManagerState,
  useSidebarManagerSnapshot,
} from 'state/sidebar-manager-state'
import { cn } from 'ui'

export const AdvisorButton = () => {
  const { ref: projectRef } = useParams()
  const sidebarSnap = useSidebarManagerSnapshot()
  const { data: lints } = useProjectLintsQuery({ projectRef })

  const hasCriticalIssues = Array.isArray(lints) && lints.some((lint) => lint.level === 'ERROR')

  const isOpen = sidebarSnap.panels[SIDEBAR_KEYS.ADVISOR_CENTER]?.open

  const handleClick = () => {
    sidebarManagerState.toggleSidebar(SIDEBAR_KEYS.ADVISOR_CENTER)
  }

  return (
    <div className="relative">
      <ButtonTooltip
        type="outline"
        size="tiny"
        id="advisor-center-trigger"
        className={cn(
          'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group',
          isOpen && 'bg-foreground text-background'
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
            'text-foreground-light group-hover:text-foreground',
            isOpen && 'text-background group-hover:text-background'
          )}
        />
      </ButtonTooltip>
      {hasCriticalIssues && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
      )}
    </div>
  )
}

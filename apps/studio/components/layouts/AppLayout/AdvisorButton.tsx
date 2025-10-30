import { Lightbulb } from 'lucide-react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { useNotificationsSummaryQuery } from 'data/notifications/notifications-v2-summary-query'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { cn } from 'ui'

interface AdvisorButtonProps {
  projectRef?: string
}

export const AdvisorButton = ({ projectRef }: AdvisorButtonProps) => {
  const { toggleSidebar, activeSidebar } = useSidebarManagerSnapshot()
  const { data: lints } = useProjectLintsQuery(
    { projectRef: projectRef ?? '' },
    { enabled: !!projectRef }
  )
  const { data: notificationsSummary } = useNotificationsSummaryQuery()

  const hasCriticalIssues = Array.isArray(lints) && lints.some((lint) => lint.level === 'ERROR')
  const hasCriticalNotifications = notificationsSummary?.has_critical ?? false
  const hasWarningNotifications = notificationsSummary?.has_warning ?? false
  const hasNewNotifications = (notificationsSummary?.unread_count ?? 0) > 0

  const hasAnyNotifications =
    hasCriticalNotifications || hasWarningNotifications || hasNewNotifications

  // Determine indicator color: critical > warning > new
  const indicatorColorClass =
    hasCriticalIssues || hasCriticalNotifications
      ? 'bg-destructive'
      : hasWarningNotifications
        ? 'bg-warning'
        : hasNewNotifications
          ? 'bg-brand'
          : ''

  const isOpen = activeSidebar?.id === SIDEBAR_KEYS.ADVISOR_PANEL

  const handleClick = () => {
    toggleSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
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
        <div className="relative">
          <Lightbulb
            size={16}
            strokeWidth={1.5}
            className={cn(
              'text-foreground-light group-hover:text-foreground',
              isOpen && 'text-background group-hover:text-background'
            )}
          />
          {(hasCriticalIssues || hasAnyNotifications) && (
            <div className="absolute -top-1.5 -right-2 w-3.5 h-3.5 z-10 flex items-center justify-center">
              <div className={cn('w-2 h-2 rounded-full', indicatorColorClass)} />
            </div>
          )}
        </div>
      </ButtonTooltip>
    </div>
  )
}

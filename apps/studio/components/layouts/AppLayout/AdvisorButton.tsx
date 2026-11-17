import { useFlag } from 'common'
import { CircleAlertIcon, LightbulbIcon } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from 'ui'

import { useUnreadAlertIssuesCount } from '@/components/interfaces/Issues/useUnreadAlertIssuesCount'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useAdvisorSignals } from '@/components/ui/AdvisorPanel/useAdvisorSignals'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useProjectLintsQuery } from '@/data/lint/lint-query'
import { useNotificationsV2Query } from '@/data/notifications/notifications-v2-query'
import { IS_PLATFORM } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export const AdvisorButton = ({ projectRef }: { projectRef?: string }) => {
  const { toggleSidebar, activeSidebar } = useSidebarManagerSnapshot()
  const track = useTrack()
  const isIssuesInboxEnabled = useFlag('issuesInbox')

  const { data: lints } = useProjectLintsQuery({ projectRef })
  const { data: signalItems } = useAdvisorSignals({ projectRef })
  const unreadAlertIssuesCount = useUnreadAlertIssuesCount(projectRef)

  const { data: notificationsData } = useNotificationsV2Query(
    { filters: {}, limit: 20 },
    { enabled: IS_PLATFORM }
  )
  const notifications = useMemo(() => {
    return notificationsData?.pages.flatMap((page) => page) ?? []
  }, [notificationsData?.pages])
  const hasUnreadNotifications = notifications.some((x) => x?.status === 'new')
  const hasCriticalNotifications = notifications.some((x) => x?.priority === 'Critical')
  const hasSignals = signalItems.length > 0
  const hasCriticalSignals = signalItems.some((item) => item.severity === 'critical')

  const hasCriticalIssues =
    hasCriticalNotifications ||
    hasCriticalSignals ||
    (Array.isArray(lints) && lints.some((lint) => lint.level === 'ERROR'))
  const hasWarningIssues = hasSignals && !hasCriticalIssues

  const isOpen = activeSidebar?.id === SIDEBAR_KEYS.ADVISOR_PANEL

  const handleClick = () => {
    track('header_advisor_button_clicked')
    toggleSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
  }

  const label = isIssuesInboxEnabled ? 'Issues' : 'Advisor Center'
  const Icon = isIssuesInboxEnabled ? CircleAlertIcon : LightbulbIcon
  const hasUnreadAlertIssues = unreadAlertIssuesCount > 0
  const unreadAlertIssuesLabel = `${unreadAlertIssuesCount} unread alert ${unreadAlertIssuesCount === 1 ? 'issue' : 'issues'}`
  const accessibleLabel = hasUnreadAlertIssues ? `${label}, ${unreadAlertIssuesLabel}` : label

  return (
    <div className="relative">
      <ButtonTooltip
        variant="outline"
        size="tiny"
        id="advisor-center-trigger"
        className={cn(
          'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 group',
          hasCriticalIssues &&
            !isOpen &&
            'bg-destructive-200 border-destructive-500 hover:border-destructive',
          isOpen && 'bg-foreground text-background'
        )}
        onClick={handleClick}
        tooltip={{
          content: {
            text: label,
          },
        }}
      >
        <Icon
          size={16}
          strokeWidth={1.5}
          className={cn(
            'text-foreground-light group-hover:text-foreground',
            isOpen && 'text-background group-hover:text-background'
          )}
        />
        <span className="sr-only">{accessibleLabel}</span>
      </ButtonTooltip>
      {hasUnreadAlertIssues ? (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-medium leading-none text-contrast',
            hasCriticalIssues ? 'bg-destructive' : 'bg-brand'
          )}
        >
          {unreadAlertIssuesCount > 9 ? '9+' : unreadAlertIssuesCount}
        </span>
      ) : hasCriticalIssues ? (
        <span
          className={cn(
            'absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full',
            isOpen ? 'bg-destructive-500 dark:bg-destructive' : 'bg-destructive'
          )}
        />
      ) : hasWarningIssues ? (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-warning" />
      ) : hasUnreadNotifications ? (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary-bright" />
      ) : null}
    </div>
  )
}

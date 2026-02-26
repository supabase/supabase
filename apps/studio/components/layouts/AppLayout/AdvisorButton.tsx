import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useProjectLintsQuery } from 'data/lint/lint-query'
import { Lightbulb } from 'lucide-react'
import { useMemo } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn } from 'ui'

import { useNotificationsV2Query } from '@/data/notifications/notifications-v2-query'

export const AdvisorButton = ({ projectRef }: { projectRef?: string }) => {
  const { toggleSidebar, activeSidebar } = useSidebarManagerSnapshot()

  const { data: lints } = useProjectLintsQuery({ projectRef })

  const { data: notificationsData } = useNotificationsV2Query({
    filters: {},
    limit: 20,
  })
  const notifications = useMemo(() => {
    return notificationsData?.pages.flatMap((page) => page) ?? []
  }, [notificationsData?.pages])
  const hasUnreadNotifications = notifications.some((x) => x.status === 'new')
  const hasCriticalNotifications = notifications.some((x) => x.priority === 'Critical')

  const hasCriticalIssues =
    hasCriticalNotifications ||
    (Array.isArray(lints) && lints.some((lint) => lint.level === 'ERROR'))

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
        <Lightbulb
          size={16}
          strokeWidth={1.5}
          className={cn(
            'text-foreground-light group-hover:text-foreground',
            isOpen && 'text-background group-hover:text-background'
          )}
        />
      </ButtonTooltip>
      {hasCriticalIssues ? (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
      ) : hasUnreadNotifications ? (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand" />
      ) : null}
    </div>
  )
}
